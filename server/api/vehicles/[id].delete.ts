import { db } from '~~/server/db'
import { vehicles } from '~~/server/db/schema/vehicle'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const vehicleId = getRouterParam(event, 'id')
  if (!vehicleId) {
    throw createError({ statusCode: 400, message: 'Vehicle ID is required' })
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
          eq(vehicles.tenantId, tenantId),
        ),
      )
      .returning()
  })

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Vehicle not found' })
  }

  return { data: { success: true } }
})
