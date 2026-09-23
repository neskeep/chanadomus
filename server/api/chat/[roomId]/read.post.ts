import { db } from '~~/server/db'
import { chatReadStatus } from '~~/server/db/schema/chat'
import { requireTenant } from '~~/server/utils/auth'
import { userCanAccessRoom } from '~~/server/utils/ws-chat'

export default defineEventHandler(async (event) => {
  const { user, tenantId } = await requireTenant(event)
  const roomId = getRouterParam(event, 'roomId')

  if (!roomId) {
    throw createError({ statusCode: 400, message: 'roomId requerido' })
  }

  const unitId = (user as Record<string, unknown>).unitId as string | null
  const hasAccess = await userCanAccessRoom(roomId, user.id, user.role ?? 'propietario', tenantId, unitId ?? null)
  if (!hasAccess) {
    throw createError({ statusCode: 403, message: 'Sin acceso a esta sala' })
  }

  await db
    .insert(chatReadStatus)
    .values({
      roomId,
      userId: user.id,
      lastReadAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [chatReadStatus.roomId, chatReadStatus.userId],
      set: { lastReadAt: new Date() },
    })

  return { success: true }
})
