import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events, eventGuests } from '~~/server/db/schema/event'
import { accessLogs } from '~~/server/db/schema/access'
import { broadcastAccessMessage } from '~~/server/utils/ws-access'
import type { EventGuest } from '~~/shared/types/event'
import { canUndoCheckout, EVENT_CHECKOUT_UNDO_WINDOW_MS } from '~~/shared/lib/event-window'

const paramsSchema = z.object({
  id: z.string().uuid(),
  guestId: z.string().uuid(),
})

/**
 * Deshacer una salida registrada por error (ticket ea2a0d07).
 *
 * Solo quien registro la salida (o admin) y dentro de EVENT_CHECKOUT_UNDO_WINDOW_MS.
 * Devuelve el invitado a 'dentro' y limpia exitAt del access log asociado.
 */
export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'vigilancia', 'conserje'])

  const { id, guestId } = validateParams(event, paramsSchema)

  const [ev] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, id), eq(events.tenantId, session.tenantId)))
    .limit(1)

  if (!ev) {
    throw createError({ statusCode: 404, message: 'Evento no encontrado' })
  }

  const [guest] = await db
    .select()
    .from(eventGuests)
    .where(and(eq(eventGuests.id, guestId), eq(eventGuests.eventId, id), eq(eventGuests.tenantId, session.tenantId)))
    .limit(1)

  if (!guest) {
    throw createError({ statusCode: 404, message: 'Invitado no encontrado' })
  }

  const allowed = canUndoCheckout(
    { guestStatus: guest.status, checkedOutAt: guest.checkedOutAt, checkedOutBy: guest.checkedOutBy },
    { userId: session.user.id, role: session.user.role as string },
  )
  if (!allowed) {
    const minutes = EVENT_CHECKOUT_UNDO_WINDOW_MS / 60_000
    throw createError({
      statusCode: 400,
      message: `Solo se puede deshacer una salida propia durante los primeros ${minutes} minutos`,
    })
  }

  const checkedOutAt = guest.checkedOutAt!
  const updated = await db.transaction(async (tx) => {
    // Condicionado a la misma salida que validamos: si cambio entre medias, no se toca.
    const [row] = await tx
      .update(eventGuests)
      .set({ status: 'dentro', checkedOutAt: null, checkedOutBy: null })
      .where(and(
        eq(eventGuests.id, guestId),
        eq(eventGuests.status, 'salio'),
        eq(eventGuests.checkedOutAt, checkedOutAt),
      ))
      .returning()

    if (!row) {
      throw createError({ statusCode: 409, message: 'La salida ya no se puede deshacer' })
    }

    if (guest.accessLogId) {
      await tx
        .update(accessLogs)
        .set({ exitAt: null })
        .where(eq(accessLogs.id, guest.accessLogId))
    }

    return row
  })

  if (guest.accessLogId) {
    broadcastAccessMessage('access-exit', { id: guest.accessLogId, exitAt: null })
  }

  const data: EventGuest = {
    id: updated.id,
    eventId: updated.eventId,
    name: updated.name,
    document: updated.document,
    vehiclePlate: updated.vehiclePlate,
    status: updated.status,
    checkedInAt: updated.checkedInAt?.toISOString() ?? null,
    checkedOutAt: null,
    checkedInBy: updated.checkedInBy,
    checkedInByName: null,
    checkedOutBy: null,
    checkedOutByName: null,
    createdAt: updated.createdAt.toISOString(),
  }

  return { data }
})
