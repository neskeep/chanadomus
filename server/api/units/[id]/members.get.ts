import { db } from '~~/server/db'
import { householdMembers } from '~~/server/db/schema/household'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenant(event)

  const unitId = getRouterParam(event, 'id')
  if (!unitId) {
    throw createError({ statusCode: 400, message: 'Unit ID is required' })
  }

  const rows = await db
    .select()
    .from(householdMembers)
    .where(
      and(
        eq(householdMembers.unitId, unitId),
        eq(householdMembers.tenantId, tenantId),
        eq(householdMembers.isActive, true),
      ),
    )
    .orderBy(asc(householdMembers.name))

  return { data: rows }
})
