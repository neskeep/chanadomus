import { z } from 'zod'
import { eq, and, count, sql } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events, eventGuests } from '~~/server/db/schema/event'
import { units } from '~~/server/db/schema/unit'
import { user } from '~~/server/db/schema/auth'
import type { EventDetail } from '~~/shared/types/event'

const paramsSchema = z.object({ id: z.string().uuid() })

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  // Lazy expiration: completar eventos vencidos antes de leer para consistencia
  await expireEvents(session.tenantId)

  const { id } = validateParams(event, paramsSchema)
  const role = session.user.role as string

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
      approvedById: events.approvedById,
      approvedAt: events.approvedAt,
      guestCount: sql<number>`coalesce(${guestCountSq.total}, 0)`.mapWith(Number),
      guestsInside: sql<number>`coalesce(${guestCountSq.inside}, 0)`.mapWith(Number),
      guestsExited: sql<number>`coalesce(${guestCountSq.exited}, 0)`.mapWith(Number),
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
    })
    .from(events)
    .leftJoin(units, eq(events.unitId, units.id))
    .leftJoin(user, eq(events.createdById, user.id))
    .leftJoin(guestCountSq, eq(events.id, guestCountSq.eventId))
    .where(and(
      eq(events.id, id),
      eq(events.tenantId, session.tenantId),
    ))
    .limit(1)

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 404, message: 'Evento no encontrado' })
  }

  // Propietario can only see own unit events
  if (role === 'propietario') {
    const userUnitId = (session.user as Record<string, unknown>).unitId as string | undefined
    if (row.unitId !== userUnitId) {
      throw createError({ statusCode: 403, message: 'Sin permisos para ver este evento' })
    }
  }

  // Get approver name separately to avoid alias conflict
  let approvedByName: string | null = null
  if (row.approvedById) {
    const [approverRow] = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, row.approvedById))
      .limit(1)
    approvedByName = approverRow?.name ?? null
  }

  const data: EventDetail = {
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
    approvedById: row.approvedById,
    approvedByName,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }

  return { data }
})
