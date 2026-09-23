import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events, eventGuests } from '~~/server/db/schema/event'
import { broadcastGuestLogExits, markGuestsExited } from '~~/server/utils/event-checkout'
import type { BulkCheckoutResult } from '~~/shared/types/event'
import { canCheckOutEvent } from '~~/shared/lib/event-window'

const paramsSchema = z.object({ id: z.string().uuid() })

/**
 * Salida masiva: registra la salida de todos los invitados que siguen 'dentro'.
 *
 * Pensado para el cierre del evento, cuando vigilancia no marco las salidas una a una.
 * checkedOutBy = usuario actual, hora = ahora. Idempotente: si otra peticion ya cerro
 * a algunos invitados, solo cuenta los que cambiaron (UPDATE condicionado a 'dentro').
 */
export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'vigilancia', 'conserje'])

  const { id } = validateParams(event, paramsSchema)

  const [ev] = await db
    .select({ id: events.id, status: events.status })
    .from(events)
    .where(and(eq(events.id, id), eq(events.tenantId, session.tenantId)))
    .limit(1)

  if (!ev) {
    throw createError({ statusCode: 404, message: 'Evento no encontrado' })
  }

  if (!canCheckOutEvent(ev)) {
    throw createError({ statusCode: 400, message: 'El evento no admite salidas en su estado actual' })
  }

  const inside = await db
    .select({ id: eventGuests.id })
    .from(eventGuests)
    .where(and(
      eq(eventGuests.eventId, id),
      eq(eventGuests.tenantId, session.tenantId),
      eq(eventGuests.status, 'dentro'),
    ))

  const now = new Date()
  const closed = await db.transaction(tx => markGuestsExited(tx, {
    tenantId: session.tenantId,
    guestIds: inside.map(g => g.id),
    at: now,
    checkedOutBy: session.user.id,
  }))

  broadcastGuestLogExits(closed)

  const data: BulkCheckoutResult = { closed: closed.length, checkedOutAt: now.toISOString() }
  return { data }
})
