import { db } from '~~/server/db'
import { vehicles } from '~~/server/db/schema/vehicle'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
  const unitId = (session.user as Record<string, unknown>).unitId as string
  const vehicleId = getRouterParam(event, 'id')

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
  }

  if (!vehicleId) {
    throw createError({ statusCode: 400, message: 'ID de vehiculo requerido' })
  }

  // Verify vehicle belongs to this unit
  const [vehicle] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(
      and(
        eq(vehicles.id, vehicleId),
        eq(vehicles.unitId, unitId),
        eq(vehicles.tenantId, tenantId),
      ),
    )
    .limit(1)

  if (!vehicle) {
    throw createError({ statusCode: 404, message: 'Vehiculo no encontrado' })
  }

  // Deactivate all active passes
  await db
    .update(vehiclePasses)
    .set({ isActive: false, deactivatedAt: new Date() })
    .where(
      and(
        eq(vehiclePasses.vehicleId, vehicleId),
        eq(vehiclePasses.isActive, true),
      ),
    )

  return { success: true }
})
