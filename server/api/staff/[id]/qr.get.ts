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

  const [record] = await db
    .select({ qrToken: staff.qrToken })
    .from(staff)
    .where(and(eq(staff.id, id), eq(staff.tenantId, tenantId)))
    .limit(1)

  if (!record) {
    throw createError({ statusCode: 404, message: 'Personal no encontrado' })
  }

  return { data: { qrToken: record.qrToken } }
})
