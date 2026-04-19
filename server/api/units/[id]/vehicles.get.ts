import { db } from '~~/server/db'
import { vehicles } from '~~/server/db/schema/vehicle'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenant(event)

  const unitId = getRouterParam(event, 'id')
  if (!unitId) {
    throw createError({ statusCode: 400, message: 'Unit ID is required' })
  }

  const rows = await db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.unitId, unitId),
        eq(vehicles.tenantId, tenantId),
      ),
    )
    .orderBy(asc(vehicles.plate))

  return { data: rows }
})
