import { db } from '~~/server/db'
import { chatRooms, chatReadStatus, messages, chatRoomMembers } from '~~/server/db/schema/chat'
import { user } from '~~/server/db/schema/auth'
import { eq, and, or, ne, inArray, desc, gt, count, isNull, sql } from 'drizzle-orm'
import { requireTenant } from '~~/server/utils/auth'
import type { ChatRoomType, ChatRoom, ChatRoomLastMessage, ChatRoomOtherUser } from '~~/shared/types/chat'

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

  // --- Group rooms (role-based, excludes 'unit' and 'direct') ---
  let groupRooms: typeof chatRooms.$inferSelect[]

  if (role === 'admin') {
    // Admin sees all group rooms
    groupRooms = await db
      .select()
      .from(chatRooms)
      .where(
        and(
          eq(chatRooms.tenantId, tenantId),
          sql`${chatRooms.type} NOT IN ('unit', 'direct')`,
        ),
      )
  }
  else {
    const accessibleTypes: ChatRoomType[] = ['general', 'incidencias']

    if (role === 'vigilancia' || role === 'conserje' || role === 'propietario') {
      accessibleTypes.push('vigilancia', 'conserjeria')
    }

    if (role === 'propietario') {
      accessibleTypes.push('admin', 'propietarios')
    }

    groupRooms = await db
      .select()
      .from(chatRooms)
      .where(
        and(
          eq(chatRooms.tenantId, tenantId),
          inArray(chatRooms.type, accessibleTypes),
          sql`${chatRooms.unitId} IS NULL`,
        ),
      )
  }

  // --- Direct rooms (via membership) ---
  const memberRows = await db
    .select({ roomId: chatRoomMembers.roomId })
    .from(chatRoomMembers)
    .where(eq(chatRoomMembers.userId, authUser.id))

  const directRooms = memberRows.length > 0
    ? await db
        .select()
        .from(chatRooms)
        .where(
          and(
            inArray(chatRooms.id, memberRows.map(r => r.roomId)),
            eq(chatRooms.type, 'direct'),
          ),
        )
    : []

  // --- Merge and attach last messages + unread counts ---
  const allRooms = [...groupRooms, ...directRooms]
  const result = await attachLastMessages(allRooms, authUser.id)

  // --- Resolve otherUser for direct rooms ---
  const directResultRooms = result.filter(r => r.type === 'direct')
  if (directResultRooms.length > 0) {
    const directRoomIds = directResultRooms.map(r => r.id)

    const allMemberships = await db
      .select({ roomId: chatRoomMembers.roomId, userId: chatRoomMembers.userId })
      .from(chatRoomMembers)
      .where(inArray(chatRoomMembers.roomId, directRoomIds))

    const otherUserIds = [
      ...new Set(
        allMemberships
          .filter(m => m.userId !== authUser.id)
          .map(m => m.userId),
      ),
    ]

    if (otherUserIds.length > 0) {
      const otherUsers = await db
        .select({ id: user.id, name: user.name, image: user.image, role: user.role })
        .from(user)
        .where(inArray(user.id, otherUserIds))

      const otherUserMap = new Map<string, ChatRoomOtherUser>(
        otherUsers.map(u => [u.id, { id: u.id, name: u.name, image: u.image, role: u.role ?? 'propietario' }]),
      )

      const roomToOther = new Map<string, ChatRoomOtherUser>(
        allMemberships
          .filter(m => m.userId !== authUser.id)
          .map(m => [m.roomId, otherUserMap.get(m.userId)!])
          .filter((entry): entry is [string, ChatRoomOtherUser] => !!entry[1]),
      )

      for (const room of result) {
        if (room.type === 'direct') {
          room.otherUser = roomToOther.get(room.id) ?? null
        }
      }
    }
  }

  return { data: result }
})
