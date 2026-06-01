import { db } from '~~/server/db'
import { vehicles } from '~~/server/db/schema/vehicle'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { eq, and } from 'drizzle-orm'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const unitId = getRouterParam(event, 'id')
  const vehicleId = getRouterParam(event, 'vehicleId')

  if (!unitId) {
    throw createError({ statusCode: 400, message: 'Unit ID is required' })
  }

  if (!vehicleId) {
    throw createError({ statusCode: 400, message: 'ID de vehiculo requerido' })
  }

  // Verify vehicle belongs to this unit and tenant
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
      unitId,
      token,
      passType: 'resident',
      issuedBy: session.user.id,
      tenantId,
    })
    .returning()

  return { data: pass }
})
