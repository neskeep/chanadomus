import { db } from '~~/server/db'
import { units } from '~~/server/db/schema/unit'
import { householdMembers } from '~~/server/db/schema/household'
import { vehicles } from '~~/server/db/schema/vehicle'
import { eq, and, sql, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenant(event)

  const rows = await db
    .select({
      id: units.id,
      number: units.number,
      label: units.label,
      memberCount: sql<number>`count(distinct ${householdMembers.id})`.as('member_count'),
      vehicleCount: sql<number>`count(distinct ${vehicles.id})`.as('vehicle_count'),
    })
    .from(units)
    .leftJoin(
      householdMembers,
      and(
        eq(householdMembers.unitId, units.id),
        eq(householdMembers.isActive, true),
      ),
    )
    .leftJoin(
      vehicles,
      eq(vehicles.unitId, units.id),
    )
    .where(eq(units.tenantId, tenantId))
    .groupBy(units.id)
    .orderBy(asc(units.number))

  return { data: rows }
})
