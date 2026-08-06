import { z } from 'zod'
import { eq, and, ilike } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events, eventGuests } from '~~/server/db/schema/event'
import { user } from '~~/server/db/schema/auth'
import type { EventGuest } from '~~/shared/types/event'

const paramsSchema = z.object({ id: z.string().uuid() })
const querySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['pendiente', 'dentro', 'salio']).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { id } = validateParams(event, paramsSchema)
  const query = validateQuery(event, querySchema)
  const role = session.user.role as string

  // Verify event exists and user has access
  const [ev] = await db
    .select({ unitId: events.unitId })
    .from(events)
    .where(and(eq(events.id, id), eq(events.tenantId, session.tenantId)))
    .limit(1)

  if (!ev) {
    throw createError({ statusCode: 404, message: 'Evento no encontrado' })
  }

  if (role === 'propietario') {
    const userUnitId = (session.user as Record<string, unknown>).unitId as string | undefined
    if (ev.unitId !== userUnitId) {
      throw createError({ statusCode: 403, message: 'Sin permisos' })
    }
  }

  // Build conditions
  const conditions = [eq(eventGuests.eventId, id), eq(eventGuests.tenantId, session.tenantId)]

  if (query.search) {
    conditions.push(ilike(eventGuests.name, `%${query.search}%`))
  }
  if (query.status) {
    conditions.push(eq(eventGuests.status, query.status))
  }

  // Since we can't alias the same table twice easily in drizzle select,
  // we'll do the main query and then resolve names separately
  const rows = await db
    .select({
      id: eventGuests.id,
      eventId: eventGuests.eventId,
      name: eventGuests.name,
      document: eventGuests.document,
      vehiclePlate: eventGuests.vehiclePlate,
      status: eventGuests.status,
      checkedInAt: eventGuests.checkedInAt,
      checkedOutAt: eventGuests.checkedOutAt,
      checkedInBy: eventGuests.checkedInBy,
      checkedOutBy: eventGuests.checkedOutBy,
      createdAt: eventGuests.createdAt,
    })
    .from(eventGuests)
    .where(and(...conditions))
    .orderBy(eventGuests.name)

  // Collect unique user IDs for name resolution
  const userIds = new Set<string>()
  for (const row of rows) {
    if (row.checkedInBy) userIds.add(row.checkedInBy)
    if (row.checkedOutBy) userIds.add(row.checkedOutBy)
  }

  const userNameMap = new Map<string, string>()
  if (userIds.size > 0) {
    for (const uid of userIds) {
      const [u] = await db.select({ name: user.name }).from(user).where(eq(user.id, uid)).limit(1)
      if (u?.name) userNameMap.set(uid, u.name)
    }
  }

  const data: EventGuest[] = rows.map((row) => ({
    id: row.id,
    eventId: row.eventId,
    name: row.name,
    document: row.document,
    vehiclePlate: row.vehiclePlate,
    status: row.status,
    checkedInAt: row.checkedInAt?.toISOString() ?? null,
    checkedOutAt: row.checkedOutAt?.toISOString() ?? null,
    checkedInBy: row.checkedInBy,
    checkedInByName: row.checkedInBy ? (userNameMap.get(row.checkedInBy) ?? null) : null,
    checkedOutBy: row.checkedOutBy,
    checkedOutByName: row.checkedOutBy ? (userNameMap.get(row.checkedOutBy) ?? null) : null,
    createdAt: row.createdAt.toISOString(),
  }))

  return { data }
})
