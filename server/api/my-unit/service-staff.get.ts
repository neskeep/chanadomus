import { db } from '~~/server/db'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { serviceStaffPasses } from '~~/server/db/schema/service-staff-pass'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { tenantId } = session
  const unitId = (session.user as Record<string, unknown>).unitId as string

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
  }

  const rows = await db
    .select({
      id: unitServiceStaff.id,
      unitId: unitServiceStaff.unitId,
      name: unitServiceStaff.name,
      roleId: unitServiceStaff.roleId,
      roleName: serviceStaffRoles.name,
      idDocument: unitServiceStaff.idDocument,
      phone: unitServiceStaff.phone,
      isActive: unitServiceStaff.isActive,
      tenantId: unitServiceStaff.tenantId,
      createdAt: unitServiceStaff.createdAt,
      passToken: serviceStaffPasses.token,
    })
    .from(unitServiceStaff)
    .leftJoin(serviceStaffRoles, eq(unitServiceStaff.roleId, serviceStaffRoles.id))
    .leftJoin(
      serviceStaffPasses,
      and(
        eq(serviceStaffPasses.staffId, unitServiceStaff.id),
        eq(serviceStaffPasses.isActive, true),
      ),
    )
    .where(
      and(
        eq(unitServiceStaff.unitId, unitId),
        eq(unitServiceStaff.tenantId, tenantId),
        eq(unitServiceStaff.isActive, true),
      ),
    )
    .orderBy(asc(unitServiceStaff.name))

  const data = rows.map(row => ({
    ...row,
    hasPass: !!row.passToken,
  }))

  return { data }
})
