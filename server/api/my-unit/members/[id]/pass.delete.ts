import { db } from '~~/server/db'
import { householdMembers } from '~~/server/db/schema/household'
import { householdMemberPasses } from '~~/server/db/schema/household-member-pass'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
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

  // Deactivate all active passes
  await db
    .update(householdMemberPasses)
    .set({ isActive: false })
    .where(
      and(
        eq(householdMemberPasses.memberId, memberId),
        eq(householdMemberPasses.isActive, true),
      ),
    )

  return { success: true }
})
