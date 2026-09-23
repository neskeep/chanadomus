import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events, eventGuests } from '~~/server/db/schema/event'
import { accessLogs } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import { broadcastAccessEvent } from '~~/server/utils/ws-access'
import type { AccessEvent } from '~~/shared/types/access'
import type { EventGuest } from '~~/shared/types/event'
import { canCheckInEvent, EVENT_LATE_CHECKIN_GRACE_MS } from '~~/shared/lib/event-window'

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

  // Se admite check-in en 'activo' y, como entrada tardia, en 'completado' hasta
  // EVENT_LATE_CHECKIN_GRACE_MS despues del fin (ver shared/lib/event-window.ts).
  if (!canCheckInEvent(ev)) {
    const graceHours = EVENT_LATE_CHECKIN_GRACE_MS / 3_600_000
    throw createError({
      statusCode: 400,
      message: ev.status === 'activo' || ev.status === 'completado'
        ? `El evento terminó hace más de ${graceHours} horas: ya no admite entradas`
        : 'El evento no admite entradas en su estado actual',
    })
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
    throw createError({ statusCode: 400, message: 'El invitado ya hizo check-in' })
  }

  // Get unit info
  const [unit] = await db
    .select({ number: units.number, label: units.label })
    .from(units)
    .where(eq(units.id, ev.unitId))
    .limit(1)

  // Access log + guest en una transaccion. El UPDATE condicionado a status='pendiente'
  // evita dobles entradas si llegan dos peticiones seguidas (doble toque).
  const now = new Date()
  const { log, updated } = await db.transaction(async (tx) => {
    const [log] = await tx
      .insert(accessLogs)
      .values({
        entryType: 'evento',
        result: 'allowed',
        visitorName: guest.name,
        visitorDocument: guest.document,
        unitId: ev.unitId,
        eventId: ev.id,
        authorizedBy: session.user.id,
        tenantId: session.tenantId,
        notes: `Evento: ${ev.title}`,
      })
      .returning({ id: accessLogs.id, createdAt: accessLogs.createdAt })

    if (!log) {
      throw createError({ statusCode: 500, message: 'Error al crear log de acceso' })
    }

    const [updated] = await tx
      .update(eventGuests)
      .set({
        status: 'dentro',
        checkedInAt: now,
        checkedInBy: session.user.id,
        accessLogId: log.id,
      })
      .where(and(eq(eventGuests.id, guestId), eq(eventGuests.status, 'pendiente')))
      .returning()

    if (!updated) {
      throw createError({ statusCode: 409, message: 'El invitado ya hizo check-in' })
    }

    return { log, updated }
  })

  // Broadcast access event
  const accessEvent: AccessEvent = {
    id: log.id,
    entryType: 'evento',
    result: 'allowed',
    visitorName: guest.name,
    visitorDocument: guest.document,
    unitNumber: unit?.number ?? null,
    unitLabel: unit?.label ?? null,
    notes: `Evento: ${ev.title}`,
    exitAt: null,
    createdAt: log.createdAt.toISOString(),
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
    checkedInByName: session.user.name ?? null,
    checkedOutBy: updated.checkedOutBy,
    checkedOutByName: null,
    createdAt: updated.createdAt.toISOString(),
  }

  return { data }
})
