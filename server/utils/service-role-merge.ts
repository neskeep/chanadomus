import { db } from '~~/server/db'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { providers } from '~~/server/db/schema/provider'
import { staff } from '~~/server/db/schema/staff'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { and, eq, inArray } from 'drizzle-orm'
import {
  buildMergedDescription,
  buildTargetAppliesUpdate,
  findServiceRoleMergeProblem,
  type ServiceRoleMergeCandidate,
} from '~~/server/utils/service-role-merge-rules'

/**
 * Filas movidas por tabla. Son todas las columnas con FK a service_staff_roles.id:
 * providers.service_role_id, staff.role_id y unit_service_staff.role_id.
 * Si se añade otra FK al catálogo, hay que sumarla aquí.
 */
export interface ServiceRoleMergeMoved {
  providers: number
  staff: number
  unitServiceStaff: number
}

export interface ServiceRoleMergeResult {
  sourceId: string
  targetId: string
  targetName: string
  moved: ServiceRoleMergeMoved
  targetAppliesUpdated: { appliesToStaff?: true; appliesToProviders?: true }
}

/**
 * Fusiona el rol `sourceId` en `targetId` dentro del tenant:
 * reasigna todas las referencias al destino, amplía los flags del destino si hace
 * falta y deja el origen inactivo con la marca "Fusionado en <destino>".
 * El origen no se borra, así que ningún registro pierde su historia.
 */
export async function mergeServiceRole(
  tenantId: string,
  sourceId: string,
  targetId: string,
): Promise<ServiceRoleMergeResult> {
  return db.transaction(async (tx) => {
    // Bloquea ambos roles para que otra fusión o edición concurrente no los cambie a medias.
    const rows: ServiceRoleMergeCandidate[] = await tx
      .select({
        id: serviceStaffRoles.id,
        name: serviceStaffRoles.name,
        description: serviceStaffRoles.description,
        isActive: serviceStaffRoles.isActive,
        appliesToStaff: serviceStaffRoles.appliesToStaff,
        appliesToProviders: serviceStaffRoles.appliesToProviders,
        tenantId: serviceStaffRoles.tenantId,
      })
      .from(serviceStaffRoles)
      .where(and(
        eq(serviceStaffRoles.tenantId, tenantId),
        inArray(serviceStaffRoles.id, [sourceId, targetId]),
      ))
      .for('update')

    const source = rows.find(r => r.id === sourceId)
    const target = rows.find(r => r.id === targetId)
    const problem = findServiceRoleMergeProblem(sourceId, targetId, source, target)
    if (problem || !source || !target) {
      throw createError(problem ?? { statusCode: 404, message: 'No encontramos los roles indicados' })
    }

    const movedProviders = await tx
      .update(providers)
      .set({ serviceRoleId: targetId, updatedAt: new Date() })
      .where(and(eq(providers.tenantId, tenantId), eq(providers.serviceRoleId, sourceId)))
      .returning({ id: providers.id })

    const movedStaff = await tx
      .update(staff)
      .set({ roleId: targetId })
      .where(and(eq(staff.tenantId, tenantId), eq(staff.roleId, sourceId)))
      .returning({ id: staff.id })

    const movedUnitStaff = await tx
      .update(unitServiceStaff)
      .set({ roleId: targetId })
      .where(and(eq(unitServiceStaff.tenantId, tenantId), eq(unitServiceStaff.roleId, sourceId)))
      .returning({ id: unitServiceStaff.id })

    const moved: ServiceRoleMergeMoved = {
      providers: movedProviders.length,
      staff: movedStaff.length,
      unitServiceStaff: movedUnitStaff.length,
    }

    const targetAppliesUpdated = buildTargetAppliesUpdate(source, target, {
      providers: moved.providers,
      staffRows: moved.staff + moved.unitServiceStaff,
    })
    if (Object.keys(targetAppliesUpdated).length > 0) {
      await tx
        .update(serviceStaffRoles)
        .set(targetAppliesUpdated)
        .where(and(eq(serviceStaffRoles.id, targetId), eq(serviceStaffRoles.tenantId, tenantId)))
    }

    await tx
      .update(serviceStaffRoles)
      .set({
        isActive: false,
        description: buildMergedDescription(source.description, target.name),
      })
      .where(and(eq(serviceStaffRoles.id, sourceId), eq(serviceStaffRoles.tenantId, tenantId)))

    return { sourceId, targetId, targetName: target.name, moved, targetAppliesUpdated }
  })
}
