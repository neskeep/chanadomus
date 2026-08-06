import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events, eventGuests } from '~~/server/db/schema/event'

const paramsSchema = z.object({
  id: z.string().uuid(),
  guestId: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'propietario', 'conserje'])

  const { id, guestId } = validateParams(event, paramsSchema)
  const role = session.user.role as string

  // Verify event
  const [ev] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.tenantId, session.tenantId)))
    .limit(1)

  if (!ev) {
    throw createError({ statusCode: 404, message: 'Evento no encontrado' })
  }

  if (role !== 'admin' && ev.createdById !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Solo el creador o admin puede eliminar invitados' })
  }

  // Verify guest
  const [guest] = await db
    .select()
    .from(eventGuests)
    .where(and(eq(eventGuests.id, guestId), eq(eventGuests.eventId, id)))
    .limit(1)

  if (!guest) {
    throw createError({ statusCode: 404, message: 'Invitado no encontrado' })
  }

  if (guest.status !== 'pendiente') {
    throw createError({ statusCode: 400, message: 'Solo se pueden eliminar invitados pendientes' })
  }

  await db.delete(eventGuests).where(eq(eventGuests.id, guestId))

  return { success: true }
})
