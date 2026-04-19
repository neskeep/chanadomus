import { db } from '~~/server/db'
import { vehicles } from '~~/server/db/schema/vehicle'
import { units } from '~~/server/db/schema/unit'
import { eq, and, asc, ilike } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenant(event)

  const query = getQuery<{ plate?: string }>(event)

  const conditions = [eq(vehicles.tenantId, tenantId)]

  if (query.plate?.trim()) {
    conditions.push(ilike(vehicles.plate, `%${query.plate.trim()}%`))
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
      unitNumber: units.number,
    })
    .from(vehicles)
    .leftJoin(units, eq(vehicles.unitId, units.id))
    .where(and(...conditions))
    .orderBy(asc(vehicles.plate))

  return { data: rows }
})
