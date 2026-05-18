import { db } from '~~/server/db'
import { householdMembers } from '~~/server/db/schema/household'
import { householdMemberPasses } from '~~/server/db/schema/household-member-pass'
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
    hasPass: !!row.passToken,
  }))

  return { data }
})
