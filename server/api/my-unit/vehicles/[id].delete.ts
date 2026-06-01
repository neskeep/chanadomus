import { db } from '~~/server/db'
import { vehicles } from '~~/server/db/schema/vehicle'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
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

  const [deleted] = await db.transaction(async (tx) => {
    await tx
      .delete(vehiclePasses)
      .where(
        and(
          eq(vehiclePasses.vehicleId, vehicleId),
          eq(vehiclePasses.tenantId, tenantId),
        ),
      )

    return tx
      .delete(vehicles)
      .where(
        and(
          eq(vehicles.id, vehicleId),
          eq(vehicles.unitId, unitId),
          eq(vehicles.tenantId, tenantId),
        ),
      )
      .returning()
  })

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Vehículo no encontrado' })
  }

  return { data: deleted }
})
