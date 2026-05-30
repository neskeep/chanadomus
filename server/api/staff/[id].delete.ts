import { db } from '~~/server/db'
import { staff } from '~~/server/db/schema/staff'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  const [updated] = await db
    .update(staff)
    .set({ isActive: false })
    .where(and(eq(staff.id, id), eq(staff.tenantId, tenantId)))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Personal no encontrado' })
  }

  return { data: { success: true } }
})
