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

  const body = await readBody<{
    plate?: string
    brand?: string
    model?: string
    color?: string
    ownerMemberId?: string | null
  }>(event)

  const updates: Record<string, unknown> = {}

  if (body.plate !== undefined) updates.plate = body.plate.trim().toUpperCase()
  if (body.brand !== undefined) updates.brand = body.brand.trim()
  if (body.model !== undefined) updates.model = body.model.trim()
  if (body.color !== undefined) updates.color = body.color.trim()
  if (body.ownerMemberId !== undefined) updates.ownerMemberId = body.ownerMemberId || null

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No fields to update' })
  }

  const [updated] = await db
    .update(vehicles)
    .set(updates)
    .where(
      and(
        eq(vehicles.id, vehicleId),
        eq(vehicles.tenantId, tenantId),
      ),
    )
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Vehicle not found' })
  }

  return { data: updated }
})
