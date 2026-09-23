import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events, eventGuests } from '~~/server/db/schema/event'
import { units } from '~~/server/db/schema/unit'
import { broadcastAccessEvent } from '~~/server/utils/ws-access'
import { markGuestsExited } from '~~/server/utils/event-checkout'
import type { AccessEvent } from '~~/shared/types/access'
import type { EventGuest } from '~~/shared/types/event'
import { canCheckOutEvent } from '~~/shared/lib/event-window'

const paramsSchema = z.object({
  id: z.string().uuid(),
  guestId: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'vigilancia', 'conserje'])

  const { id, guestId } = validateParams(event, paramsSchema)

  // Verify event
  const [ev] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.tenantId, session.tenantId)))
    .limit(1)

  if (!ev) {
    throw createError({ statusCode: 404, message: 'Evento no encontrado' })
  }

  // Se permite check-out en eventos 'activo' o 'completado' para registrar
  // salidas tardias de invitados que quedaron 'dentro' cuando el evento vencio
  // (lazy expiration lo transiciona a 'completado' al pasar endsAt). Solo se
  // bloquea en 'cancelado' o 'pendiente'.
  if (!canCheckOutEvent(ev)) {
    throw createError({ statusCode: 400, message: 'El evento no admite check-out en su estado actual' })
  }

  // Verify guest
  const [guest] = await db
    .select()
    .from(eventGuests)
    .where(and(eq(eventGuests.id, guestId), eq(eventGuests.eventId, id), eq(eventGuests.tenantId, session.tenantId)))
    .limit(1)

  if (!guest) {
    throw createError({ statusCode: 404, message: 'Invitado no encontrado' })
  }

  if (guest.status !== 'dentro') {
    throw createError({ statusCode: 400, message: 'El invitado no esta dentro del evento' })
  }

  // UPDATE condicionado a status='dentro' (markGuestsExited): si llegan dos peticiones
  // seguidas para el mismo invitado, solo la primera registra la salida.
  const now = new Date()
  const updated = await db.transaction(async (tx) => {
    const [row] = await markGuestsExited(tx, {
      tenantId: session.tenantId,
      guestIds: [guestId],
      at: now,
      checkedOutBy: session.user.id,
    })

    if (!row) {
      throw createError({ statusCode: 409, message: 'El invitado ya tiene la salida registrada' })
    }

    return row
  })

  // Get unit info for broadcast
  const [unit] = await db
    .select({ number: units.number, label: units.label })
    .from(units)
    .where(eq(units.id, ev.unitId))
    .limit(1)

  // Broadcast exit event
  const accessEvent: AccessEvent = {
    id: guest.accessLogId ?? updated.id,
    entryType: 'evento',
    result: 'allowed',
    visitorName: guest.name,
    visitorDocument: guest.document,
    unitNumber: unit?.number ?? null,
    unitLabel: unit?.label ?? null,
    notes: `Evento: ${ev.title} (salida)`,
    exitAt: now.toISOString(),
    createdAt: updated.createdAt.toISOString(),
    eventId: ev.id,
  }

  broadcastAccessEvent(accessEvent)

  const data: EventGuest = {
    id: updated.id,
    eventId: updated.eventId,
    name: updated.name,
    document: updated.document,
    vehiclePlate: updated.vehiclePlate,
    status: updated.status,
    checkedInAt: updated.checkedInAt?.toISOString() ?? null,
    checkedOutAt: updated.checkedOutAt?.toISOString() ?? null,
    checkedInBy: updated.checkedInBy,
    checkedInByName: null,
    checkedOutBy: updated.checkedOutBy,
    checkedOutByName: session.user.name ?? null,
    createdAt: updated.createdAt.toISOString(),
  }

  return { data }
})
