import { z } from 'zod'
import { eq, and, count, sql } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events, eventGuests } from '~~/server/db/schema/event'
import { units } from '~~/server/db/schema/unit'
import { user } from '~~/server/db/schema/auth'
import type { EventSummary, EventStatus } from '~~/shared/types/event'

const VALID_STATUSES: EventStatus[] = ['pendiente', 'activo', 'completado', 'cancelado']

const querySchema = z.object({
  status: z.string().optional(),
  unitId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const query = validateQuery(event, querySchema)
  const role = session.user.role as string

  if (query.status && !VALID_STATUSES.includes(query.status as EventStatus)) {
    throw createError({ statusCode: 400, message: 'Estado invalido' })
  }

  // Build conditions
  const conditions = [eq(events.tenantId, session.tenantId)]

  // Role-based filtering
  if (role === 'propietario' || role === 'conserje') {
    const userUnitId = (session.user as Record<string, unknown>).unitId as string | undefined
    if (!userUnitId) {
      throw createError({ statusCode: 400, message: 'Usuario sin unidad asignada' })
    }
    conditions.push(eq(events.unitId, userUnitId))
  } else if (role === 'vigilancia') {
    conditions.push(eq(events.status, 'activo'))
  }

  // Query filters
  if (query.status) {
    conditions.push(eq(events.status, query.status as EventStatus))
  }
  if (query.unitId && role === 'admin') {
    conditions.push(eq(events.unitId, query.unitId))
  }

  const whereClause = and(...conditions)
  const offset = (query.page - 1) * query.limit

  // Guest count subqueries
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

  // Total count
  const [totalRow] = await db
    .select({ total: count() })
    .from(events)
    .where(whereClause)

  const total = totalRow?.total ?? 0

  // Paginated results
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
    .where(whereClause)
    .orderBy(events.startsAt)
    .limit(query.limit)
    .offset(offset)

  const data: EventSummary[] = rows.map((row) => ({
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

  return { data, meta: { total, page: query.page, limit: query.limit } }
})
