import { db } from '~~/server/db'
import { chatReadStatus } from '~~/server/db/schema/chat'
import { requireTenant } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { user } = await requireTenant(event)
  const roomId = getRouterParam(event, 'roomId')

  if (!roomId) {
    throw createError({ statusCode: 400, message: 'roomId requerido' })
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
