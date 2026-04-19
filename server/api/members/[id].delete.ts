import { db } from '~~/server/db'
import { householdMembers } from '~~/server/db/schema/household'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const memberId = getRouterParam(event, 'id')
  if (!memberId) {
    throw createError({ statusCode: 400, message: 'Member ID is required' })
  }

  const [updated] = await db
    .update(householdMembers)
    .set({ isActive: false })
    .where(
      and(
        eq(householdMembers.id, memberId),
        eq(householdMembers.tenantId, tenantId),
      ),
    )
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Member not found' })
  }

  return { data: { success: true } }
})
