import type { Peer } from 'crossws'
import type { ChatMessage } from '~~/shared/types/chat'
import { db } from '~~/server/db'
import { messages, chatRooms, chatRoomMembers } from '~~/server/db/schema/chat'
import { user } from '~~/server/db/schema/auth'
import { pushSubscriptions } from '~~/server/db/schema/push'
import { eq, and } from 'drizzle-orm'
import { sendPushToUsers } from './web-push'

export interface ChatPeerInfo {
  userId: string
  userName: string
  userImage: string | null
  tenantId: string
  roomId: string
}

// Map of roomId -> Set of peers in that room
const roomPeers = new Map<string, Set<Peer>>()

// Map of peer -> user info for quick lookup
const peerInfo = new Map<Peer, ChatPeerInfo>()

export function addChatPeer(peer: Peer, roomId: string, userInfo: Omit<ChatPeerInfo, 'roomId'>) {
  const info: ChatPeerInfo = { ...userInfo, roomId }
  peerInfo.set(peer, info)

  if (!roomPeers.has(roomId)) {
    roomPeers.set(roomId, new Set())
  }
  roomPeers.get(roomId)!.add(peer)
}

export function removeChatPeer(peer: Peer) {
  const info = peerInfo.get(peer)
  if (info) {
    const peers = roomPeers.get(info.roomId)
    if (peers) {
      peers.delete(peer)
      if (peers.size === 0) {
        roomPeers.delete(info.roomId)
      }
    }
    peerInfo.delete(peer)
  }
}

export function getChatPeerInfo(peer: Peer): ChatPeerInfo | undefined {
  return peerInfo.get(peer)
}

export function broadcastToRoom(roomId: string, message: string, excludePeerId?: string) {
  const peers = roomPeers.get(roomId)
  if (!peers) return

  for (const peer of peers) {
    if (excludePeerId && peer.id === excludePeerId) continue
    peer.send(message)
  }
}

export async function insertAndBroadcastMessage(
  roomId: string,
  userId: string,
  content: string,
): Promise<ChatMessage> {
  // Insert into DB
  const rows = await db
    .insert(messages)
    .values({ roomId, userId, content })
    .returning()

  const inserted = rows[0]
  if (!inserted) {
    throw new Error('Failed to insert message')
  }

  // Fetch user info for the broadcast payload
  const senderRows = await db
    .select({ id: user.id, name: user.name, image: user.image })
    .from(user)
    .where(eq(user.id, userId))

  const sender = senderRows[0]

  const chatMessage: ChatMessage = {
    id: inserted.id,
    roomId: inserted.roomId,
    userId: inserted.userId,
    content: inserted.content,
    createdAt: inserted.createdAt.toISOString(),
    user: sender ? { id: sender.id, name: sender.name, image: sender.image } : undefined,
  }

  broadcastToRoom(roomId, JSON.stringify({ type: 'message', data: chatMessage }))

  // Send push notifications to offline room members (fire-and-forget)
  sendChatPushToOfflineMembers(roomId, userId, sender?.name ?? 'Usuario', content).catch(() => {})

  return chatMessage
}

/**
 * Check if a user has access to a specific chat room.
 * Returns true if access is granted, false otherwise.
 */
export async function userCanAccessRoom(
  roomId: string,
  userId: string,
  userRole: string,
  userTenantId: string,
  userUnitId: string | null,
): Promise<boolean> {
  const [room] = await db
    .select()
    .from(chatRooms)
    .where(eq(chatRooms.id, roomId))

  if (!room) return false
  if (room.tenantId !== userTenantId) return false

  switch (room.type) {
    case 'general':
      return true
    case 'incidencias':
      return true
    case 'unit':
      return userRole === 'admin' || userRole === 'vigilancia' || (userUnitId !== null && userUnitId === room.unitId)
    case 'vigilancia':
      return ['admin', 'vigilancia', 'conserje', 'propietario'].includes(userRole)
    case 'conserjeria':
      return ['admin', 'conserje', 'vigilancia', 'propietario'].includes(userRole)
    case 'admin':
      return ['admin', 'propietario'].includes(userRole)
    case 'propietarios':
      return ['admin', 'propietario'].includes(userRole)
    case 'direct': {
      const [membership] = await db
        .select({ id: chatRoomMembers.id })
        .from(chatRoomMembers)
        .where(
          and(
            eq(chatRoomMembers.roomId, roomId),
            eq(chatRoomMembers.userId, userId),
          ),
        )
      return !!membership
    }
    default:
      return false
  }
}

/**
 * Sends push notifications to room members who are NOT currently connected via WebSocket.
 * For 'direct' rooms: queries chatRoomMembers.
 * For group rooms: queries all push subscribers in the tenant, filtered by chat preference.
 */
async function sendChatPushToOfflineMembers(
  roomId: string,
  senderId: string,
  senderName: string,
  messageContent: string,
) {
  // Get room info
  const [room] = await db
    .select({ id: chatRooms.id, name: chatRooms.name, type: chatRooms.type, tenantId: chatRooms.tenantId })
    .from(chatRooms)
    .where(eq(chatRooms.id, roomId))

  if (!room) return

  // Get IDs of users currently connected to this room via WebSocket
  const connectedUserIds = getConnectedUserIds(roomId)
  // Always exclude the sender
  connectedUserIds.add(senderId)

  const truncatedContent = messageContent.length > 100
    ? messageContent.slice(0, 100) + '...'
    : messageContent

  const payload = {
    title: room.type === 'direct' ? senderName : `${senderName} en ${room.name}`,
    body: truncatedContent,
    url: `/mi-chana/chat/${roomId}`,
    category: 'chat',
  }

  let offlineUserIds: string[]

  if (room.type === 'direct') {
    // For direct rooms, query explicit members
    const members = await db
      .select({ userId: chatRoomMembers.userId })
      .from(chatRoomMembers)
      .where(eq(chatRoomMembers.roomId, roomId))

    offlineUserIds = members
      .map(m => m.userId)
      .filter(id => !connectedUserIds.has(id))
  } else {
    // For group rooms, find all subscribers in tenant with chat enabled
    // We send to all tenant subscribers and let sendPushToUsers handle preference filtering
    const subs = await db
      .select({ userId: pushSubscriptions.userId })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.tenantId, room.tenantId))

    offlineUserIds = [...new Set(subs.map(s => s.userId))]
      .filter(id => !connectedUserIds.has(id))
  }

  if (offlineUserIds.length > 0) {
    await sendPushToUsers(offlineUserIds, payload, 'chat')
  }
}

/** Returns the set of user IDs currently connected to a room via WebSocket */
function getConnectedUserIds(roomId: string): Set<string> {
  const peers = roomPeers.get(roomId)
  const ids = new Set<string>()
  if (!peers) return ids
  for (const peer of peers) {
    const info = peerInfo.get(peer)
    if (info) ids.add(info.userId)
  }
  return ids
}
