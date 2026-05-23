import { db } from '~~/server/db'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const body = await readBody<{ name?: string; description?: string; displayOrder?: number }>(event)

  if (!body.name || !body.name.trim()) {
    throw createError({ statusCode: 400, message: 'El nombre es requerido' })
  }

  const [inserted] = await db
    .insert(serviceStaffRoles)
    .values({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      displayOrder: body.displayOrder ?? 0,
      tenantId,
    })
    .returning()

  setResponseStatus(event, 201)
  return { data: inserted }
})
