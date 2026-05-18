import { db } from '~~/server/db'
import { householdMembers } from '~~/server/db/schema/household'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
  const unitId = (session.user as Record<string, unknown>).unitId as string

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
  }

  const memberId = getRouterParam(event, 'id')
  if (!memberId) {
    throw createError({ statusCode: 400, message: 'Member ID es requerido' })
  }

  const [deactivated] = await db
    .update(householdMembers)
    .set({ isActive: false })
    .where(
      and(
        eq(householdMembers.id, memberId),
        eq(householdMembers.unitId, unitId),
        eq(householdMembers.tenantId, tenantId),
      ),
    )
    .returning()

  if (!deactivated) {
    throw createError({ statusCode: 404, message: 'Miembro no encontrado' })
  }

  return { data: deactivated }
})
