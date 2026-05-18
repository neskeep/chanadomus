import { db } from '~~/server/db'
import { vehicles } from '~~/server/db/schema/vehicle'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
  const unitId = (session.user as Record<string, unknown>).unitId as string

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
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
    hasPass: !!row.passToken,
  }))

  return { data }
})
