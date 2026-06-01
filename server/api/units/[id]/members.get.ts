import { db } from '~~/server/db'
import { householdMembers } from '~~/server/db/schema/household'
import { householdMemberPasses } from '~~/server/db/schema/household-member-pass'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenant(event)

  const unitId = getRouterParam(event, 'id')
  if (!unitId) {
    throw createError({ statusCode: 400, message: 'Unit ID is required' })
  }

  const rows = await db
    .select({
      id: householdMembers.id,
      unitId: householdMembers.unitId,
      name: householdMembers.name,
      relationship: householdMembers.relationship,
      idDocument: householdMembers.idDocument,
      phone: householdMembers.phone,
      isActive: householdMembers.isActive,
      tenantId: householdMembers.tenantId,
      createdAt: householdMembers.createdAt,
      passToken: householdMemberPasses.token,
    })
    .from(householdMembers)
    .leftJoin(
      householdMemberPasses,
      and(
        eq(householdMemberPasses.memberId, householdMembers.id),
        eq(householdMemberPasses.isActive, true),
      ),
    )
    .where(
      and(
        eq(householdMembers.unitId, unitId),
        eq(householdMembers.tenantId, tenantId),
        eq(householdMembers.isActive, true),
      ),
    )
    .orderBy(asc(householdMembers.name))

  const data = rows.map(row => ({
    ...row,
    passToken: row.passToken ?? null,
  }))

  return { data }
})
