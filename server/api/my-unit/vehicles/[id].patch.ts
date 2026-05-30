import { db } from '~~/server/db'
import { vehicles } from '~~/server/db/schema/vehicle'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { tenantId } = session
  const unitId = (session.user as Record<string, unknown>).unitId as string

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
  }

  const vehicleId = getRouterParam(event, 'id')
  if (!vehicleId) {
    throw createError({ statusCode: 400, message: 'Vehicle ID es requerido' })
  }

  const body = await readBody<{
    plate?: string
    brand?: string
    model?: string
    color?: string
    ownerMemberId?: string | null
  }>(event)

  const updateData: Record<string, unknown> = {}
  if (body.plate !== undefined) {
    if (!body.plate?.trim()) {
      throw createError({ statusCode: 400, message: 'La placa no puede estar vacía' })
    }
    updateData.plate = body.plate.trim().toUpperCase()
  }
  if (body.brand !== undefined) {
    if (!body.brand?.trim()) {
      throw createError({ statusCode: 400, message: 'La marca no puede estar vacía' })
    }
    updateData.brand = body.brand.trim()
  }
  if (body.model !== undefined) {
    if (!body.model?.trim()) {
      throw createError({ statusCode: 400, message: 'El modelo no puede estar vacío' })
    }
    updateData.model = body.model.trim()
  }
  if (body.color !== undefined) {
    if (!body.color?.trim()) {
      throw createError({ statusCode: 400, message: 'El color no puede estar vacío' })
    }
    updateData.color = body.color.trim()
  }
  if (body.ownerMemberId !== undefined) updateData.ownerMemberId = body.ownerMemberId

  if (Object.keys(updateData).length === 0) {
    throw createError({ statusCode: 400, message: 'No hay campos para actualizar' })
  }

  const [updated] = await db
    .update(vehicles)
    .set(updateData)
    .where(
      and(
        eq(vehicles.id, vehicleId),
        eq(vehicles.unitId, unitId),
        eq(vehicles.tenantId, tenantId),
      ),
    )
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Vehículo no encontrado' })
  }

  return { data: updated }
})
