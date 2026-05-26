import { db } from '~~/server/db'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { providers } from '~~/server/db/schema/provider'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const roleId = getRouterParam(event, 'id')
  if (!roleId) {
    throw createError({ statusCode: 400, message: 'Role ID es requerido' })
  }

  // Check if role is in use by staff
  const inUseByStaff = await db
    .select({ id: unitServiceStaff.id })
    .from(unitServiceStaff)
    .where(eq(unitServiceStaff.roleId, roleId))
    .limit(1)

  if (inUseByStaff.length > 0) {
    throw createError({ statusCode: 409, message: 'No se puede eliminar un rol asignado a personal' })
  }

  // Check if role is in use by providers
  const inUseByProvider = await db
    .select({ id: providers.id })
    .from(providers)
    .where(eq(providers.serviceRoleId, roleId))
    .limit(1)

  if (inUseByProvider.length > 0) {
    throw createError({ statusCode: 409, message: 'No se puede eliminar un rol asignado a proveedores' })
  }

  const [deleted] = await db
    .delete(serviceStaffRoles)
    .where(
      and(
        eq(serviceStaffRoles.id, roleId),
        eq(serviceStaffRoles.tenantId, tenantId),
      ),
    )
    .returning()

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Rol no encontrado' })
  }

  return { data: { success: true } }
})
