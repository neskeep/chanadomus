import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events } from '~~/server/db/schema/event'
import { units } from '~~/server/db/schema/unit'
import { sendPushToRole } from '~~/server/utils/web-push'
import type { EventDetail } from '~~/shared/types/event'

const createEventSchema = z.object({
  title: z.string().min(1, 'El titulo es requerido').max(200),
  description: z.string().optional().nullable(),
  unitId: z.string().uuid().optional(),
  startsAt: z.string().min(1).refine((v) => !isNaN(new Date(v).getTime()), 'Fecha de inicio invalida'),
  endsAt: z.string().min(1).refine((v) => !isNaN(new Date(v).getTime()), 'Fecha de fin invalida'),
  guestLimit: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'propietario', 'conserje'])

  const body = await validateBody(event, createEventSchema)
  const role = session.user.role as string

  // Determine unitId based on role
  let unitId: string

  if (role === 'propietario' || role === 'conserje') {
    const userUnitId = (session.user as Record<string, unknown>).unitId as string | undefined
    if (!userUnitId) {
      throw createError({ statusCode: 400, message: 'Usuario sin unidad asignada' })
    }
    unitId = userUnitId
  } else {
    if (!body.unitId) {
      throw createError({ statusCode: 400, message: 'unitId es requerido' })
    }
    unitId = body.unitId
  }

  // Validate dates
  const startsAt = new Date(body.startsAt)
  const endsAt = new Date(body.endsAt)

  if (startsAt <= new Date()) {
    throw createError({ statusCode: 400, message: 'La fecha de inicio debe ser futura' })
  }
  if (endsAt <= startsAt) {
    throw createError({ statusCode: 400, message: 'La fecha de fin debe ser posterior a la de inicio' })
  }

  // Verify unit exists and belongs to tenant
  const [unit] = await db
    .select({ id: units.id, number: units.number, label: units.label })
    .from(units)
    .where(eq(units.id, unitId))
    .limit(1)

  if (!unit) {
    throw createError({ statusCode: 404, message: 'Unidad no encontrada' })
  }

  const status = role === 'admin' ? 'activo' : 'pendiente'

  const rows = await db
    .insert(events)
    .values({
      title: body.title.trim(),
      description: body.description?.trim() || null,
      unitId,
      createdById: session.user.id,
      tenantId: session.tenantId,
      status: status as 'pendiente' | 'activo',
      startsAt,
      endsAt,
      guestLimit: body.guestLimit ?? null,
      notes: body.notes?.trim() || null,
      approvedById: role === 'admin' ? session.user.id : null,
      approvedAt: role === 'admin' ? new Date() : null,
    })
    .returning()

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 500, message: 'Error al crear el evento' })
  }

  const data: EventDetail = {
    id: row.id,
    title: row.title,
    description: row.description,
    unitId: row.unitId,
    unitNumber: unit.number,
    unitLabel: unit.label,
    createdById: row.createdById,
    createdByName: session.user.name ?? null,
    status: row.status,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    guestLimit: row.guestLimit,
    notes: row.notes,
    guestCount: 0,
    guestsInside: 0,
    guestsExited: 0,
    approvedById: row.approvedById,
    approvedByName: role === 'admin' ? (session.user.name ?? null) : null,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }

  // Push notification to admin when non-admin creates
  if (role !== 'admin') {
    const creatorName = session.user.name || 'Un usuario'
    await sendPushToRole(session.tenantId, 'admin', {
      title: 'Nuevo evento pendiente',
      body: `${creatorName} solicita aprobacion para: ${body.title.trim()}`,
      url: '/mi-chana/eventos',
    }, 'anuncio').catch(() => {})
  }

  return { data }
})
