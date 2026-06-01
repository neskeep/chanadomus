import { db } from '~~/server/db'
import { vehicles } from '~~/server/db/schema/vehicle'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenant(event)

  const unitId = getRouterParam(event, 'id')
  if (!unitId) {
    throw createError({ statusCode: 400, message: 'Unit ID is required' })
  }

  const rows = await db
    .select({
      id: vehicles.id,
      unitId: vehicles.unitId,
      ownerMemberId: vehicles.ownerMemberId,
      plate: vehicles.plate,
      brand: vehicles.brand,
      model: vehicles.model,
      color: vehicles.color,
      tenantId: vehicles.tenantId,
      createdAt: vehicles.createdAt,
      passToken: vehiclePasses.token,
    })
    .from(vehicles)
    .leftJoin(
      vehiclePasses,
      and(
        eq(vehiclePasses.vehicleId, vehicles.id),
        eq(vehiclePasses.isActive, true),
      ),
    )
    .where(
      and(
        eq(vehicles.unitId, unitId),
        eq(vehicles.tenantId, tenantId),
      ),
    )
    .orderBy(asc(vehicles.plate))

  const data = rows.map(row => ({
    ...row,
    passToken: row.passToken ?? null,
  }))

  return { data }
})
