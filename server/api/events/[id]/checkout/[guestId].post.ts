import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events, eventGuests } from '~~/server/db/schema/event'
import { accessLogs } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import { broadcastAccessEvent } from '~~/server/utils/ws-access'
import type { AccessEvent } from '~~/shared/types/access'
import type { EventGuest } from '~~/shared/types/event'

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
  if (ev.status !== 'activo' && ev.status !== 'completado') {
    throw createError({ statusCode: 400, message: 'El evento no admite check-out en su estado actual' })
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

  if (guest.status !== 'dentro') {
    throw createError({ statusCode: 400, message: 'El invitado no esta dentro del evento' })
  }

  const now = new Date()

  // Update access log with exit time
  if (guest.accessLogId) {
    await db
      .update(accessLogs)
      .set({ exitAt: now })
      .where(eq(accessLogs.id, guest.accessLogId))
  }

  // Update guest
  const [updated] = await db
    .update(eventGuests)
    .set({
      status: 'salio',
      checkedOutAt: now,
      checkedOutBy: session.user.id,
    })
    .where(eq(eventGuests.id, guestId))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 500, message: 'Error al actualizar invitado' })
  }

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
