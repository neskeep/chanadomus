import { db } from '~~/server/db'
import { invitations } from '~~/server/db/schema/invitation'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID es requerido' })
  }

  const [invitation] = await db
    .select({
      id: invitations.id,
      usedAt: invitations.usedAt,
      revokedAt: invitations.revokedAt,
    })
    .from(invitations)
    .where(and(eq(invitations.id, id), eq(invitations.tenantId, tenantId)))
    .limit(1)

  if (!invitation) {
    throw createError({ statusCode: 404, message: 'Invitacion no encontrada' })
  }

  if (invitation.usedAt) {
    throw createError({ statusCode: 400, message: 'La invitacion ya fue utilizada' })
  }

  if (invitation.revokedAt) {
    throw createError({ statusCode: 400, message: 'La invitacion ya fue revocada' })
  }

  const now = new Date()
  await db
    .update(invitations)
    .set({ revokedAt: now, updatedAt: now })
    .where(eq(invitations.id, id))

  return { data: { success: true } }
})
