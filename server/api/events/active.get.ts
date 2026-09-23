import { eq, and, sql, count, lt, gte, inArray } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events, eventGuests } from '~~/server/db/schema/event'
import { units } from '~~/server/db/schema/unit'
import { user } from '~~/server/db/schema/auth'
import type { EventSummary } from '~~/shared/types/event'
import { guardCandidateMinEndsAt, isVisibleToGuard } from '~~/shared/lib/event-window'

/**
 * Eventos que vigilancia puede operar ahora (ver shared/lib/event-window.ts):
 * - no terminados que se solapan con el dia local de hoy;
 * - terminados hace menos de 2 h (check-in tardio) o con invitados dentro
 *   hasta 24 h despues del fin, para poder registrar salidas.
 */

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'vigilancia', 'conserje'])

  // Lazy expiration: pasa a 'completado' los vencidos para que el status sea coherente
  // con admin/propietario (el evento sigue visible aqui mientras aplique la ventana).
  await expireEvents(session.tenantId)

  const now = new Date()
  const today = localTodayRangeUtc(now)

  const guestCountSq = db
    .select({
      eventId: eventGuests.eventId,
      total: count().as('total'),
      inside: sql<number>`count(*) filter (where ${eventGuests.status} = 'dentro')`.as('inside'),
      exited: sql<number>`count(*) filter (where ${eventGuests.status} = 'salio')`.as('exited'),
    })
    .from(eventGuests)
    .groupBy(eventGuests.eventId)
    .as('gc')

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      unitId: events.unitId,
      unitNumber: units.number,
      unitLabel: units.label,
      createdById: events.createdById,
      createdByName: user.name,
      status: events.status,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      guestLimit: events.guestLimit,
      notes: events.notes,
      guestCount: sql<number>`coalesce("gc"."total", 0)`.mapWith(Number),
      guestsInside: sql<number>`coalesce("gc"."inside", 0)`.mapWith(Number),
      guestsExited: sql<number>`coalesce("gc"."exited", 0)`.mapWith(Number),
      createdAt: events.createdAt,
    })
    .from(events)
    .leftJoin(units, eq(events.unitId, units.id))
    .leftJoin(user, eq(events.createdById, user.id))
    .leftJoin(guestCountSq, eq(events.id, guestCountSq.eventId))
    .where(and(
      eq(events.tenantId, session.tenantId),
      inArray(events.status, ['activo', 'completado']),
      lt(events.startsAt, today.end),
      gte(events.endsAt, guardCandidateMinEndsAt(today, now)),
    ))
    .orderBy(events.startsAt)

  const visible = rows.filter(row => isVisibleToGuard(row, today, now))

  const data: EventSummary[] = visible.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    unitId: row.unitId,
    unitNumber: row.unitNumber,
    unitLabel: row.unitLabel,
    createdById: row.createdById,
    createdByName: row.createdByName,
    status: row.status,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    guestLimit: row.guestLimit,
    notes: row.notes,
    guestCount: row.guestCount,
    guestsInside: row.guestsInside,
    guestsExited: row.guestsExited,
    createdAt: row.createdAt.toISOString(),
  }))

  return { data }
})
