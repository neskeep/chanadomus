import { db } from '~~/server/db'
import { householdMembers } from '~~/server/db/schema/household'
import { householdMemberPasses } from '~~/server/db/schema/household-member-pass'
import { eq, and } from 'drizzle-orm'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const unitId = getRouterParam(event, 'id')
  const memberId = getRouterParam(event, 'memberId')

  if (!unitId) {
    throw createError({ statusCode: 400, message: 'Unit ID is required' })
  }

  if (!memberId) {
    throw createError({ statusCode: 400, message: 'ID de integrante requerido' })
  }

  // Verify member belongs to this unit and tenant
  const [member] = await db
    .select({ id: householdMembers.id })
    .from(householdMembers)
    .where(
      and(
        eq(householdMembers.id, memberId),
        eq(householdMembers.unitId, unitId),
        eq(householdMembers.tenantId, tenantId),
        eq(householdMembers.isActive, true),
      ),
    )
    .limit(1)

  if (!member) {
    throw createError({ statusCode: 404, message: 'Integrante no encontrado' })
  }

  // Deactivate any existing active pass for this member
  await db
    .update(householdMemberPasses)
    .set({ isActive: false })
    .where(
      and(
        eq(householdMemberPasses.memberId, memberId),
        eq(householdMemberPasses.isActive, true),
      ),
    )

  // Create new pass
  const token = crypto.randomUUID()
  const [pass] = await db
    .insert(householdMemberPasses)
    .values({
      memberId,
      unitId,
      token,
      tenantId,
    })
    .returning()

  return { data: pass }
})
