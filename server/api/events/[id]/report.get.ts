import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events, eventGuests } from '~~/server/db/schema/event'

const paramsSchema = z.object({ id: z.string().uuid() })

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'propietario'])

  const { id } = validateParams(event, paramsSchema)
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

  // Propietario only own unit
  if (role === 'propietario') {
    const userUnitId = (session.user as Record<string, unknown>).unitId as string | undefined
    if (ev.unitId !== userUnitId) {
      throw createError({ statusCode: 403, message: 'Sin permisos' })
    }
  }

  if (!['activo', 'completado'].includes(ev.status)) {
    throw createError({ statusCode: 400, message: 'El reporte solo esta disponible para eventos activos o completados' })
  }

  // Get all guests
  const guests = await db
    .select({
      status: eventGuests.status,
      checkedInAt: eventGuests.checkedInAt,
      checkedOutAt: eventGuests.checkedOutAt,
    })
    .from(eventGuests)
    .where(eq(eventGuests.eventId, id))

  const totalGuests = guests.length
  const guestsEntered = guests.filter((g) => g.status === 'dentro' || g.status === 'salio').length
  const guestsExited = guests.filter((g) => g.status === 'salio').length
  const guestsNeverShowed = guests.filter((g) => g.status === 'pendiente').length

  // Calculate peak occupancy and average stay
  // Build timeline of entries and exits
  const timeline: { time: Date; delta: number }[] = []
  const stayMinutes: number[] = []
  let firstCheckIn: Date | null = null
  let lastCheckOut: Date | null = null

  for (const g of guests) {
    if (g.checkedInAt) {
      timeline.push({ time: g.checkedInAt, delta: 1 })
      if (!firstCheckIn || g.checkedInAt < firstCheckIn) {
        firstCheckIn = g.checkedInAt
      }
    }
    if (g.checkedOutAt) {
      timeline.push({ time: g.checkedOutAt, delta: -1 })
      if (!lastCheckOut || g.checkedOutAt > lastCheckOut) {
        lastCheckOut = g.checkedOutAt
      }
    }
    if (g.checkedInAt && g.checkedOutAt) {
      const diff = (g.checkedOutAt.getTime() - g.checkedInAt.getTime()) / (1000 * 60)
      stayMinutes.push(diff)
    }
  }

  // Sort by time and compute peak
  timeline.sort((a, b) => a.time.getTime() - b.time.getTime())
  let current = 0
  let peakOccupancy = 0
  for (const entry of timeline) {
    current += entry.delta
    if (current > peakOccupancy) peakOccupancy = current
  }

  const averageStayMinutes = stayMinutes.length > 0
    ? Math.round(stayMinutes.reduce((a, b) => a + b, 0) / stayMinutes.length)
    : null

  return {
    data: {
      totalGuests,
      guestsEntered,
      guestsExited,
      guestsNeverShowed,
      peakOccupancy,
      averageStayMinutes,
      firstCheckIn: firstCheckIn?.toISOString() ?? null,
      lastCheckOut: lastCheckOut?.toISOString() ?? null,
    },
  }
})
