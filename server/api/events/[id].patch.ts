import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events } from '~~/server/db/schema/event'

const paramsSchema = z.object({ id: z.string().uuid() })

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  startsAt: z.string().refine((v) => !isNaN(new Date(v).getTime()), 'Fecha invalida').optional(),
  endsAt: z.string().refine((v) => !isNaN(new Date(v).getTime()), 'Fecha invalida').optional(),
  guestLimit: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'propietario', 'conserje'])

  const { id } = validateParams(event, paramsSchema)
  const body = await validateBody(event, updateEventSchema)
  const role = session.user.role as string

  // Fetch existing event
  const [existing] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.tenantId, session.tenantId)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Evento no encontrado' })
  }

  // Only creator or admin
  if (role !== 'admin' && existing.createdById !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Solo el creador o admin puede editar' })
  }

  // Can only update pendiente or activo
  if (!['pendiente', 'activo'].includes(existing.status)) {
    throw createError({ statusCode: 400, message: 'Solo se pueden editar eventos pendientes o activos' })
  }

  // Validate date logic if provided
  const startsAt = body.startsAt ? new Date(body.startsAt) : undefined
  const endsAt = body.endsAt ? new Date(body.endsAt) : undefined

  const effectiveStart = startsAt ?? existing.startsAt
  const effectiveEnd = endsAt ?? existing.endsAt

  if (effectiveEnd <= effectiveStart) {
    throw createError({ statusCode: 400, message: 'La fecha de fin debe ser posterior a la de inicio' })
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (body.title !== undefined) updateData.title = body.title.trim()
  if (body.description !== undefined) updateData.description = body.description?.trim() || null
  if (startsAt) updateData.startsAt = startsAt
  if (endsAt) updateData.endsAt = endsAt
  if (body.guestLimit !== undefined) updateData.guestLimit = body.guestLimit
  if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null

  const [updated] = await db
    .update(events)
    .set(updateData)
    .where(eq(events.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 500, message: 'Error al actualizar el evento' })
  }

  return {
    data: {
      id: updated.id,
      title: updated.title,
      status: updated.status,
      startsAt: updated.startsAt.toISOString(),
      endsAt: updated.endsAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  }
})
