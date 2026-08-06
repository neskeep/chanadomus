import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events, eventGuests } from '~~/server/db/schema/event'
import type { EventGuest } from '~~/shared/types/event'

const paramsSchema = z.object({ id: z.string().uuid() })

const createGuestsSchema = z.object({
  guests: z.array(z.object({
    name: z.string().min(1, 'Nombre requerido').max(200),
    document: z.string().optional().nullable(),
    vehiclePlate: z.string().optional().nullable(),
  })).min(1, 'Al menos un invitado es requerido'),
})

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'propietario', 'conserje'])

  const { id } = validateParams(event, paramsSchema)
  const body = await validateBody(event, createGuestsSchema)
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

  if (role !== 'admin' && ev.createdById !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Solo el creador o admin puede agregar invitados' })
  }

  if (!['pendiente', 'activo'].includes(ev.status)) {
    throw createError({ statusCode: 400, message: 'No se pueden agregar invitados a este evento' })
  }

  // Get existing guest names for dedup
  const existingGuests = await db
    .select({ name: eventGuests.name })
    .from(eventGuests)
    .where(eq(eventGuests.eventId, id))

  const existingNames = new Set(existingGuests.map((g) => g.name.toLowerCase().trim()))

  // Deduplicate
  const toInsert: { name: string; document: string | null; vehiclePlate: string | null }[] = []
  let duplicates = 0

  for (const guest of body.guests) {
    const normalized = guest.name.toLowerCase().trim()
    if (existingNames.has(normalized)) {
      duplicates++
      continue
    }
    existingNames.add(normalized) // prevent duplicates within batch
    toInsert.push({
      name: guest.name.trim(),
      document: guest.document?.trim() || null,
      vehiclePlate: guest.vehiclePlate?.trim() || null,
    })
  }

  if (toInsert.length === 0) {
    return { data: [], duplicates }
  }

  // Check guest limit
  if (ev.guestLimit) {
    const currentCount = existingGuests.length
    if (currentCount + toInsert.length > ev.guestLimit) {
      throw createError({
        statusCode: 400,
        message: `Limite de invitados excedido. Limite: ${ev.guestLimit}, actuales: ${currentCount}, intentando agregar: ${toInsert.length}`,
      })
    }
  }

  const inserted = await db
    .insert(eventGuests)
    .values(toInsert.map((g) => ({
      eventId: id,
      tenantId: session.tenantId,
      name: g.name,
      document: g.document,
      vehiclePlate: g.vehiclePlate,
    })))
    .returning()

  const data: EventGuest[] = inserted.map((row) => ({
    id: row.id,
    eventId: row.eventId,
    name: row.name,
    document: row.document,
    vehiclePlate: row.vehiclePlate,
    status: row.status,
    checkedInAt: null,
    checkedOutAt: null,
    checkedInBy: null,
    checkedInByName: null,
    checkedOutBy: null,
    checkedOutByName: null,
    createdAt: row.createdAt.toISOString(),
  }))

  return { data, duplicates }
})
