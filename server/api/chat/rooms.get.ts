import { db } from '~~/server/db'
import { chatRooms, chatReadStatus, messages } from '~~/server/db/schema/chat'
import { user } from '~~/server/db/schema/auth'
import { eq, and, or, ne, inArray, desc, gt, count, isNull, sql } from 'drizzle-orm'
import { requireTenant } from '~~/server/utils/auth'
import type { ChatRoomType, ChatRoom, ChatRoomLastMessage } from '~~/shared/types/chat'

async function attachLastMessages(rooms: { id: string; name: string; type: string; unitId: string | null; tenantId: string; createdAt: Date }[], authUserId: string): Promise<ChatRoom[]> {
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

  // Calculate unread message counts per room (exclude own messages)
  const unreadMap = new Map<string, number>()
  try {
    const unreadCounts = await db
      .select({
        roomId: messages.roomId,
        count: count(messages.id),
      })
      .from(messages)
      .leftJoin(
        chatReadStatus,
        and(
          eq(chatReadStatus.roomId, messages.roomId),
          eq(chatReadStatus.userId, authUserId),
        ),
      )
      .where(
        and(
          inArray(messages.roomId, roomIds),
          ne(messages.userId, authUserId),
          or(
            isNull(chatReadStatus.lastReadAt),
            gt(messages.createdAt, chatReadStatus.lastReadAt),
          ),
        ),
      )
      .groupBy(messages.roomId)

    for (const row of unreadCounts) {
      unreadMap.set(row.roomId, Number(row.count))
    }
  }
  catch (err) {
    console.error('[chat/rooms] Error calculating unread counts:', err)
  }

  return rooms.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type as ChatRoomType,
    unitId: r.unitId,
    tenantId: r.tenantId,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    lastMessage: lastMessageMap.get(r.id) ?? null,
    unreadCount: unreadMap.get(r.id) ?? 0,
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

    return { data: await attachLastMessages(rooms, authUser.id) }
  }

  // Build accessible room types based on role
  const accessibleTypes: ChatRoomType[] = ['general', 'incidencias']

  if (role === 'vigilancia' || role === 'conserje' || role === 'propietario') {
    accessibleTypes.push('vigilancia', 'conserjeria')
  }

  if (role === 'propietario') {
    accessibleTypes.push('admin', 'propietarios')
  }

  // For non-unit room types (general, vigilancia, etc.)
  const conditions = [
    and(
      eq(chatRooms.tenantId, tenantId),
      inArray(chatRooms.type, accessibleTypes),
      sql`${chatRooms.unitId} IS NULL`,
    ),
  ]

  // Propietarios: only their own unit room
  if (role === 'propietario' && unitId) {
    conditions.push(
      and(
        eq(chatRooms.tenantId, tenantId),
        eq(chatRooms.type, 'unit'),
        eq(chatRooms.unitId, unitId),
      ),
    )
  }

  // Vigilancia: access to ALL unit rooms (can chat with any rancho)
  if (role === 'vigilancia') {
    conditions.push(
      and(
        eq(chatRooms.tenantId, tenantId),
        eq(chatRooms.type, 'unit'),
      ),
    )
  }

  const rooms = await db
    .select()
    .from(chatRooms)
    .where(or(...conditions))

  return { data: await attachLastMessages(rooms, authUser.id) }
})
