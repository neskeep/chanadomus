import { db } from '~~/server/db'
import { staff } from '~~/server/db/schema/staff'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  // Verify staff exists and belongs to tenant
  const [existing] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, id), eq(staff.tenantId, tenantId)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Personal no encontrado' })
  }

  const qrToken = randomUUID()

  await db
    .update(staff)
    .set({ qrToken })
    .where(and(eq(staff.id, id), eq(staff.tenantId, tenantId)))

  return { data: { qrToken } }
})
