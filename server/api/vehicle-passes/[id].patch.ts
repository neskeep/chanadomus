import { db } from '~~/server/db'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { eq, and } from 'drizzle-orm'
import type { UpdateVehiclePassInput } from '~~/shared/types/vehicle-pass'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'id es requerido' })
  }

  const body = await readBody<UpdateVehiclePassInput>(event)

  // Validate pass exists and belongs to tenant
  const [existing] = await db
    .select({ id: vehiclePasses.id })
    .from(vehiclePasses)
    .where(and(eq(vehiclePasses.id, id), eq(vehiclePasses.tenantId, tenantId)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Pase vehicular no encontrado' })
  }

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {}

  if (body.occupantLimit !== undefined) {
    if (body.occupantLimit !== null && (typeof body.occupantLimit !== 'number' || body.occupantLimit < 1)) {
      throw createError({ statusCode: 400, message: 'occupantLimit debe ser un numero positivo o null' })
    }
    updates.occupantLimit = body.occupantLimit
  }
  if (body.expiresAt !== undefined) {
    updates.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
  }
  if (body.notes !== undefined) {
    updates.notes = body.notes
  }
  if (body.isActive !== undefined) {
    updates.isActive = body.isActive
    if (!body.isActive) {
      updates.deactivatedAt = new Date()
    }
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No hay campos para actualizar' })
  }

  const rows = await db
    .update(vehiclePasses)
    .set(updates)
    .where(and(eq(vehiclePasses.id, id), eq(vehiclePasses.tenantId, tenantId)))
    .returning()

  const updated = rows[0]
  if (!updated) {
    throw createError({ statusCode: 500, message: 'Error al actualizar pase vehicular' })
  }

  return {
    data: {
      ...updated,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      deactivatedAt: updated.deactivatedAt?.toISOString() ?? null,
    },
  }
})
