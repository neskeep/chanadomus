import { db } from '~~/server/db'
import { messages } from '~~/server/db/schema/chat'
import { user } from '~~/server/db/schema/auth'
import { eq, and, desc, lt } from 'drizzle-orm'
import { requireTenant } from '~~/server/utils/auth'
import { userCanAccessRoom } from '~~/server/utils/ws-chat'

const MESSAGES_LIMIT = 50

export default defineEventHandler(async (event) => {
  const { user: sessionUser, tenantId } = await requireTenant(event)
  const roomId = getRouterParam(event, 'roomId')

  if (!roomId) {
    throw createError({ statusCode: 400, message: 'Missing roomId parameter' })
  }

  const role = sessionUser.role ?? 'propietario'
  const unitId = (sessionUser as Record<string, unknown>).unitId as string | null

  // Validate room access
  const hasAccess = await userCanAccessRoom(roomId, sessionUser.id, role, tenantId, unitId)
  if (!hasAccess) {
    throw createError({ statusCode: 403, message: 'No access to this room' })
  }

  // Cursor-based pagination
  const query = getQuery(event)
  const before = typeof query.before === 'string' ? query.before : undefined

  // Build conditions
  const conditions = [eq(messages.roomId, roomId)]

  if (before) {
    // Get the created_at of the cursor message
    const [cursorMessage] = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.id, before))

    if (cursorMessage) {
      conditions.push(lt(messages.createdAt, cursorMessage.createdAt))
    }
  }

  const result = await db
    .select({
      id: messages.id,
      roomId: messages.roomId,
      userId: messages.userId,
      content: messages.content,
      createdAt: messages.createdAt,
      userName: user.name,
      userImage: user.image,
    })
    .from(messages)
    .innerJoin(user, eq(messages.userId, user.id))
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(MESSAGES_LIMIT)

  const data = result.map((row) => ({
    id: row.id,
    roomId: row.roomId,
    userId: row.userId,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    user: {
      id: row.userId,
      name: row.userName,
      image: row.userImage,
    },
  }))

  return { data }
})
