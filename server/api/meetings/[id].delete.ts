import { db } from '~~/server/db'
import { meetings } from '~~/server/db/schema/meeting'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de la reunion es requerido' })
  }

  // Check meeting exists and belongs to tenant
  const [existing] = await db
    .select({ id: meetings.id })
    .from(meetings)
    .where(and(eq(meetings.id, id), eq(meetings.tenantId, session.tenantId)))

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Reunion no encontrada' })
  }

  // Delete meeting
  await db
    .delete(meetings)
    .where(and(eq(meetings.id, id), eq(meetings.tenantId, session.tenantId)))

  return { data: { success: true } }
})
