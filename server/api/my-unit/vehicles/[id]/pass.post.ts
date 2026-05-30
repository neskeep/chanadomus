import { db } from '~~/server/db'
import { vehicles } from '~~/server/db/schema/vehicle'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { eq, and } from 'drizzle-orm'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { tenantId } = session
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

  // Deactivate any existing active pass for this vehicle
  await db
    .update(vehiclePasses)
    .set({ isActive: false, deactivatedAt: new Date() })
    .where(
      and(
        eq(vehiclePasses.vehicleId, vehicleId),
        eq(vehiclePasses.isActive, true),
      ),
    )

  // Create new pass
  const token = crypto.randomUUID()
  const [pass] = await db
    .insert(vehiclePasses)
    .values({
      vehicleId,
      token,
      passType: 'resident',
      issuedBy: session.user.id,
      tenantId,
    })
    .returning()

  return { data: pass }
})
