import { db } from '~~/server/db'
import { householdMembers } from '~~/server/db/schema/household'
import { householdMemberPasses } from '~~/server/db/schema/household-member-pass'
import { eq, and } from 'drizzle-orm'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { tenantId } = session
  const unitId = (session.user as Record<string, unknown>).unitId as string
  const memberId = getRouterParam(event, 'id')

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
  }

  if (!memberId) {
    throw createError({ statusCode: 400, message: 'ID de integrante requerido' })
  }

  // Verify member belongs to this unit
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
