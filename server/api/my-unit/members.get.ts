import { db } from '~~/server/db'
import { householdMembers } from '~~/server/db/schema/household'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
  const unitId = (session.user as Record<string, unknown>).unitId as string

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
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
