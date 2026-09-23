import type { Peer } from 'crossws'
import type { ChatMessage } from '~~/shared/types/chat'
import { db } from '~~/server/db'
import { messages, chatRooms, chatRoomMembers } from '~~/server/db/schema/chat'
import { user } from '~~/server/db/schema/auth'
import { eq, and } from 'drizzle-orm'
import { canAccessChatRoom, computeChatPushRecipients, type ChatPushCandidate } from '~~/shared/lib/chat-access'
import { sendPushToUsers } from './web-push'

export interface ChatPeerInfo {
  userId: string
  userName: string
  userImage: string | null
  tenantId: string
  roomId: string
  /** La pestana/app tiene la sala en primer plano (Page Visibility API del cliente). */
  visible: boolean
  /** Ultimo ping o mensaje recibido del peer (ms epoch). */
  lastSeenAt: number
}

/**
 * Si un peer no manda ping en este tiempo se considera que ya no ve la sala
 * (movil bloqueado o PWA en segundo plano con el socket aun abierto).
 * El cliente hace ping cada 30 s.
 */
const VIEWING_STALE_MS = 75_000

// Map of roomId -> Set of peers in that room
const roomPeers = new Map<string, Set<Peer>>()

// Map of peer -> user info for quick lookup
const peerInfo = new Map<Peer, ChatPeerInfo>()

export function addChatPeer(
  peer: Peer,
  roomId: string,
  userInfo: Omit<ChatPeerInfo, 'roomId' | 'visible' | 'lastSeenAt'>,
) {
  const info: ChatPeerInfo = { ...userInfo, roomId, visible: true, lastSeenAt: Date.now() }
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

/** Marca actividad del peer (ping o mensaje). */
export function touchChatPeer(peer: Peer) {
  const info = peerInfo.get(peer)
  if (info) info.lastSeenAt = Date.now()
}

/** Actualiza si el peer tiene la sala visible en pantalla. */
export function setChatPeerVisibility(peer: Peer, visible: boolean) {
  const info = peerInfo.get(peer)
  if (!info) return
  info.visible = visible
  info.lastSeenAt = Date.now()
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

  // Push a quien tiene acceso y no esta viendo la sala (fire-and-forget)
  notifyChatMessage(roomId, userId, sender?.name ?? 'Usuario', content).catch((err: unknown) => {
    console.error('[ws-chat] push error:', err)
  })

  return chatMessage
}

/**
 * Check if a user has access to a specific chat room.
 * La matriz rol -> sala vive en shared/lib/chat-access.ts (incluye salas ocultas).
 */
export async function userCanAccessRoom(
  roomId: string,
  userId: string,
  userRole: string,
  userTenantId: string,
  userUnitId: string | null,
): Promise<boolean> {
  const [room] = await db
    .select({ type: chatRooms.type, unitId: chatRooms.unitId, tenantId: chatRooms.tenantId })
    .from(chatRooms)
    .where(eq(chatRooms.id, roomId))

  if (!room) return false
  if (room.tenantId !== userTenantId) return false

  const isDirectMember = room.type === 'direct'
    ? await isRoomMember(roomId, userId)
    : false

  return canAccessChatRoom({ role: userRole, unitId: userUnitId }, room, isDirectMember)
}

async function isRoomMember(roomId: string, userId: string): Promise<boolean> {
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

/**
 * Resuelve los destinatarios del push de un mensaje: usuarios con acceso a la sala
 * (misma matriz que el listado), menos el autor y quien la esta viendo ahora.
 */
export async function resolveChatPushRecipients(roomId: string, senderId: string): Promise<string[]> {
  const [room] = await db
    .select({ type: chatRooms.type, unitId: chatRooms.unitId, tenantId: chatRooms.tenantId })
    .from(chatRooms)
    .where(eq(chatRooms.id, roomId))

  if (!room) return []

  let candidates: ChatPushCandidate[]
  let directMemberIds: Set<string> | undefined

  if (room.type === 'direct') {
    const members = await db
      .select({ id: user.id, role: user.role, unitId: user.unitId, banned: user.banned })
      .from(chatRoomMembers)
      .innerJoin(user, eq(user.id, chatRoomMembers.userId))
      .where(eq(chatRoomMembers.roomId, roomId))
    candidates = members
    directMemberIds = new Set(members.map(m => m.id))
  }
  else {
    candidates = await db
      .select({ id: user.id, role: user.role, unitId: user.unitId, banned: user.banned })
      .from(user)
      .where(eq(user.tenantId, room.tenantId))
  }

  return computeChatPushRecipients({
    room,
    candidates,
    senderId,
    viewingUserIds: getViewingUserIds(roomId),
    directMemberIds,
  })
}

/**
 * Envia push de un mensaje de chat a quienes tienen acceso a la sala y no la
 * estan viendo. La preferencia `chat` se aplica en sendPushToUsers.
 */
export async function notifyChatMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  messageContent: string,
  imageCount = 0,
) {
  const [room] = await db
    .select({ name: chatRooms.name, type: chatRooms.type })
    .from(chatRooms)
    .where(eq(chatRooms.id, roomId))

  if (!room) return

  const recipients = await resolveChatPushRecipients(roomId, senderId)
  if (recipients.length === 0) return

  const text = messageContent.trim()
  const body = text
    ? (text.length > 100 ? text.slice(0, 100) + '...' : text)
    : (imageCount > 1 ? `Envió ${imageCount} fotos` : 'Envió una foto')

  await sendPushToUsers(recipients, {
    title: room.type === 'direct' ? senderName : `${senderName} en ${room.name}`,
    body,
    url: `/mi-chana/chat/${roomId}`,
    category: 'chat',
    // Un aviso por sala (como WhatsApp): mensajes de salas distintas no se pisan
    tag: `chat-${roomId}`,
  }, 'chat')
}

/**
 * Usuarios que estan viendo la sala ahora: socket abierto en esa sala, pestana
 * visible y ping reciente. Tener la app abierta en otra pantalla no cuenta.
 */
export function getViewingUserIds(roomId: string): Set<string> {
  const peers = roomPeers.get(roomId)
  const ids = new Set<string>()
  if (!peers) return ids
  const now = Date.now()
  for (const peer of peers) {
    const info = peerInfo.get(peer)
    if (info && info.visible && now - info.lastSeenAt <= VIEWING_STALE_MS) {
      ids.add(info.userId)
    }
  }
  return ids
}
