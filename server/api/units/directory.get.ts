import { db } from '~~/server/db'
import { units } from '~~/server/db/schema/unit'
import { householdMembers } from '~~/server/db/schema/household'
import { vehicles } from '~~/server/db/schema/vehicle'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { eq, and, sql, asc, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenant(event)

  const rows = await db
    .select({
      id: units.id,
      number: units.number,
      label: units.label,
      isActive: units.isActive,
      memberCount: sql<number>`count(distinct ${householdMembers.id})`.as('member_count'),
      vehicleCount: sql<number>`count(distinct ${vehicles.id})`.as('vehicle_count'),
      staffCount: sql<number>`count(distinct ${unitServiceStaff.id})`.as('staff_count'),
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
    .leftJoin(
      unitServiceStaff,
      and(
        eq(unitServiceStaff.unitId, units.id),
        eq(unitServiceStaff.isActive, true),
      ),
    )
    .where(eq(units.tenantId, tenantId))
    .groupBy(units.id)
    .orderBy(
      desc(units.isActive),
      sql`CASE WHEN ${units.number} LIKE 'R-%' THEN 0 ELSE 1 END`,
      asc(units.label),
    )

  return { data: rows }
})
