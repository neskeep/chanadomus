import { db } from '~~/server/db'
import { polls } from '~~/server/db/schema/poll'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de votacion requerido' })
  }

  // Get current poll
  const [existing] = await db
    .select()
    .from(polls)
    .where(and(
      eq(polls.id, id),
      eq(polls.tenantId, session.tenantId),
    ))

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Votacion no encontrada' })
  }

  // Cannot delete active polls — must close first
  if (existing.status === 'active') {
    throw createError({ statusCode: 400, message: 'No se puede eliminar una votacion activa. Cierre la votacion primero.' })
  }

  // CASCADE delete removes options and votes automatically
  await db
    .delete(polls)
    .where(eq(polls.id, id))

  return { success: true }
})
