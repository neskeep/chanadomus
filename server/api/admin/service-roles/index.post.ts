import { db } from '~~/server/db'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const body = await readBody<{ name?: string; description?: string; displayOrder?: number; appliesToStaff?: boolean; appliesToProviders?: boolean }>(event)

  if (!body.name || !body.name.trim()) {
    throw createError({ statusCode: 400, message: 'El nombre es requerido' })
  }

  const [inserted] = await db
    .insert(serviceStaffRoles)
    .values({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      appliesToStaff: body.appliesToStaff ?? true,
      appliesToProviders: body.appliesToProviders ?? false,
      displayOrder: body.displayOrder ?? 0,
      tenantId,
    })
    .returning()

  setResponseStatus(event, 201)
  return { data: inserted }
})
