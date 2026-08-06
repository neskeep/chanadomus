import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events, eventGuests } from '~~/server/db/schema/event'
import type { BulkImportResult } from '~~/shared/types/event'

const paramsSchema = z.object({ id: z.string().uuid() })
const bulkSchema = z.object({
  text: z.string().min(1, 'El texto es requerido'),
})

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'propietario', 'conserje'])

  const { id } = validateParams(event, paramsSchema)
  const body = await validateBody(event, bulkSchema)
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
    throw createError({ statusCode: 403, message: 'Solo el creador o admin puede importar invitados' })
  }

  if (!['pendiente', 'activo'].includes(ev.status)) {
    throw createError({ statusCode: 400, message: 'No se pueden agregar invitados a este evento' })
  }

  // Parse text: one name per line, optional "Name, Cedula" format
  const lines = body.text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  const errors: string[] = []
  const parsed: { name: string; document: string | null }[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const parts = line.split(',').map((p) => p.trim())
    const name = parts[0]
    if (!name || name.length < 1) {
      errors.push(`Linea ${i + 1}: nombre vacio`)
      continue
    }
    if (name.length > 200) {
      errors.push(`Linea ${i + 1}: nombre demasiado largo`)
      continue
    }
    parsed.push({
      name,
      document: parts[1] || null,
    })
  }

  // Get existing names for dedup
  const existingGuests = await db
    .select({ name: eventGuests.name })
    .from(eventGuests)
    .where(eq(eventGuests.eventId, id))

  const existingNames = new Set(existingGuests.map((g) => g.name.toLowerCase()))

  const toInsert: { name: string; document: string | null }[] = []
  let duplicates = 0

  for (const guest of parsed) {
    const normalized = guest.name.toLowerCase()
    if (existingNames.has(normalized)) {
      duplicates++
      continue
    }
    existingNames.add(normalized)
    toInsert.push(guest)
  }

  // Check guest limit
  if (ev.guestLimit && toInsert.length > 0) {
    const currentCount = existingGuests.length
    if (currentCount + toInsert.length > ev.guestLimit) {
      throw createError({
        statusCode: 400,
        message: `Limite de invitados excedido. Limite: ${ev.guestLimit}, actuales: ${currentCount}, intentando agregar: ${toInsert.length}`,
      })
    }
  }

  if (toInsert.length > 0) {
    await db.insert(eventGuests).values(
      toInsert.map((g) => ({
        eventId: id,
        tenantId: session.tenantId,
        name: g.name,
        document: g.document,
        vehiclePlate: null,
      })),
    )
  }

  const result: BulkImportResult = {
    added: toInsert.length,
    duplicates,
    errors,
  }

  return { data: result }
})
