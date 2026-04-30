import { db } from '~~/server/db'
import { chatRooms, messages } from '~~/server/db/schema/chat'
import { user } from '~~/server/db/schema/auth'
import { eq, and, or, inArray, desc, sql } from 'drizzle-orm'
import { requireTenant } from '~~/server/utils/auth'
import type { ChatRoomType, ChatRoom, ChatRoomLastMessage } from '~~/shared/types/chat'

async function attachLastMessages(rooms: { id: string; name: string; type: string; unitId: string | null; tenantId: string; createdAt: Date }[]): Promise<ChatRoom[]> {
  if (rooms.length === 0) return []

  const roomIds = rooms.map(r => r.id)

  // PostgreSQL DISTINCT ON to get latest message per room
  const lastMessages = await db
    .selectDistinctOn([messages.roomId], {
      roomId: messages.roomId,
      content: messages.content,
      createdAt: messages.createdAt,
      userName: user.name,
    })
    .from(messages)
    .innerJoin(user, eq(messages.userId, user.id))
    .where(inArray(messages.roomId, roomIds))
    .orderBy(messages.roomId, desc(messages.createdAt))

  const lastMessageMap = new Map<string, ChatRoomLastMessage>()
  for (const msg of lastMessages) {
    lastMessageMap.set(msg.roomId, {
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      userName: msg.userName,
    })
  }

  return rooms.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type as ChatRoomType,
    unitId: r.unitId,
    tenantId: r.tenantId,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    lastMessage: lastMessageMap.get(r.id) ?? null,
  }))
}

export default defineEventHandler(async (event) => {
  const { user: authUser, tenantId } = await requireTenant(event)
  const role = authUser.role ?? 'propietario'
  const unitId = (authUser as Record<string, unknown>).unitId as string | null

  // Admin gets all rooms for the tenant
  if (role === 'admin') {
    const rooms = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.tenantId, tenantId))

    return { data: await attachLastMessages(rooms) }
  }

  // Build accessible room types based on role
  const accessibleTypes: ChatRoomType[] = ['general']

  if (role === 'vigilancia' || role === 'conserje') {
    accessibleTypes.push('vigilancia')
  }

  // For non-unit room types (general, vigilancia, etc.)
  const conditions = [
    and(
      eq(chatRooms.tenantId, tenantId),
      inArray(chatRooms.type, accessibleTypes),
      sql`${chatRooms.unitId} IS NULL`,
    ),
  ]

  // Add unit room access for propietarios who have a unit assigned
  if (role === 'propietario' && unitId) {
    conditions.push(
      and(
        eq(chatRooms.tenantId, tenantId),
        eq(chatRooms.type, 'unit'),
        eq(chatRooms.unitId, unitId),
      ),
    )
  }

  const rooms = await db
    .select()
    .from(chatRooms)
    .where(or(...conditions))

  return { data: await attachLastMessages(rooms) }
})
