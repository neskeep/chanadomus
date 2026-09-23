import { db } from '~~/server/db'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { eq, and, asc } from 'drizzle-orm'
import type { ServiceRoleAppliesTo } from '~~/shared/types/service-role'

export interface ListServiceRolesOptions {
  appliesTo?: ServiceRoleAppliesTo
  includeInactive?: boolean
}

/**
 * Lista los roles de servicio del tenant, ordenados por displayOrder y nombre.
 * Por defecto solo devuelve los activos.
 */
export async function listServiceRoles(tenantId: string, options: ListServiceRolesOptions = {}) {
  const conditions = [eq(serviceStaffRoles.tenantId, tenantId)]
  if (!options.includeInactive) {
    conditions.push(eq(serviceStaffRoles.isActive, true))
  }
  if (options.appliesTo === 'staff') {
    conditions.push(eq(serviceStaffRoles.appliesToStaff, true))
  }
  else if (options.appliesTo === 'provider') {
    conditions.push(eq(serviceStaffRoles.appliesToProviders, true))
  }

  return db
    .select()
    .from(serviceStaffRoles)
    .where(and(...conditions))
    .orderBy(asc(serviceStaffRoles.displayOrder), asc(serviceStaffRoles.name))
}

/**
 * Verifica que un rol de servicio pertenezca al tenant y, si `requireProviderActive`,
 * que esté activo y aplique a proveedores. Lanza 400 si no cumple.
 */
export async function assertProviderServiceRole(
  tenantId: string,
  serviceRoleId: string,
  { requireProviderActive = true }: { requireProviderActive?: boolean } = {},
) {
  if (!isUuid(serviceRoleId)) {
    throw createError({ statusCode: 400, message: 'Categoría inválida' })
  }

  const [role] = await db
    .select({
      id: serviceStaffRoles.id,
      isActive: serviceStaffRoles.isActive,
      appliesToProviders: serviceStaffRoles.appliesToProviders,
    })
    .from(serviceStaffRoles)
    .where(and(eq(serviceStaffRoles.id, serviceRoleId), eq(serviceStaffRoles.tenantId, tenantId)))

  if (!role || (requireProviderActive && (!role.isActive || !role.appliesToProviders))) {
    throw createError({ statusCode: 400, message: 'Categoría inválida' })
  }
  return role
}
