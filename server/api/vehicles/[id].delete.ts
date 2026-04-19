import { db } from '~~/server/db'
import { vehicles } from '~~/server/db/schema/vehicle'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const vehicleId = getRouterParam(event, 'id')
  if (!vehicleId) {
    throw createError({ statusCode: 400, message: 'Vehicle ID is required' })
  }

  const [deleted] = await db
    .delete(vehicles)
    .where(
      and(
        eq(vehicles.id, vehicleId),
        eq(vehicles.tenantId, tenantId),
      ),
    )
    .returning()

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Vehicle not found' })
  }

  return { data: { success: true } }
})
