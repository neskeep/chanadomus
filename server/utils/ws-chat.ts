import type { Peer } from 'crossws'
import type { ChatMessage } from '~~/shared/types/chat'
import { db } from '~~/server/db'
import { messages, chatRooms } from '~~/server/db/schema/chat'
import { user } from '~~/server/db/schema/auth'
import { eq } from 'drizzle-orm'

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
    case 'unit':
      return userRole === 'admin' || userRole === 'vigilancia' || (userUnitId !== null && userUnitId === room.unitId)
    case 'vigilancia':
      return ['admin', 'vigilancia', 'conserje'].includes(userRole)
    case 'admin':
      return userRole === 'admin'
    default:
      return false
  }
}
