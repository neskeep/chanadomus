import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events } from '~~/server/db/schema/event'

const paramsSchema = z.object({ id: z.string().uuid() })

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'propietario', 'conserje'])

  const { id } = validateParams(event, paramsSchema)
  const role = session.user.role as string

  const [existing] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.tenantId, session.tenantId)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Evento no encontrado' })
  }

  if (role !== 'admin' && existing.createdById !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Solo el creador o admin puede eliminar' })
  }

  if (existing.status !== 'pendiente') {
    throw createError({ statusCode: 400, message: 'Solo se pueden eliminar eventos pendientes' })
  }

  await db.delete(events).where(eq(events.id, id))

  return { success: true }
})
