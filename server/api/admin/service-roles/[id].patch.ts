import { db } from '~~/server/db'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const roleId = getRouterParam(event, 'id')
  if (!roleId) {
    throw createError({ statusCode: 400, message: 'Role ID es requerido' })
  }

  const body = await readBody<{ name?: string; description?: string; isActive?: boolean; displayOrder?: number; appliesToStaff?: boolean; appliesToProviders?: boolean }>(event)

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) {
    if (!body.name.trim()) {
      throw createError({ statusCode: 400, message: 'El nombre es requerido' })
    }
    updates.name = body.name.trim()
  }
  if (body.description !== undefined) updates.description = body.description?.trim() || null
  if (body.isActive !== undefined) updates.isActive = body.isActive
  if (body.displayOrder !== undefined) updates.displayOrder = body.displayOrder
  if (body.appliesToStaff !== undefined) updates.appliesToStaff = body.appliesToStaff
  if (body.appliesToProviders !== undefined) updates.appliesToProviders = body.appliesToProviders

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No se proporcionaron campos para actualizar' })
  }

  const [updated] = await db
    .update(serviceStaffRoles)
    .set(updates)
    .where(
      and(
        eq(serviceStaffRoles.id, roleId),
        eq(serviceStaffRoles.tenantId, tenantId),
      ),
    )
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Rol no encontrado' })
  }

  return { data: updated }
})
