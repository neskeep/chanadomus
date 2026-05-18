import { db } from '~~/server/db'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const roleId = getRouterParam(event, 'id')
  if (!roleId) {
    throw createError({ statusCode: 400, message: 'Role ID es requerido' })
  }

  const body = await readBody<{ name?: string }>(event)

  if (!body.name || !body.name.trim()) {
    throw createError({ statusCode: 400, message: 'El nombre es requerido' })
  }

  const [updated] = await db
    .update(serviceStaffRoles)
    .set({ name: body.name.trim() })
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
