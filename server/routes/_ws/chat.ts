import { db } from '~~/server/db'
import { session, user } from '~~/server/db/schema/auth'
import { eq, and, gt } from 'drizzle-orm'
import {
  addChatPeer,
  removeChatPeer,
  getChatPeerInfo,
  insertAndBroadcastMessage,
  userCanAccessRoom,
} from '~~/server/utils/ws-chat'

interface IncomingMessage {
  type: 'message'
  content: string
}

function isValidIncomingMessage(data: unknown): data is IncomingMessage {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return obj.type === 'message' && typeof obj.content === 'string'
}

export default defineWebSocketHandler({
  async open(peer) {
    try {
      // Extract query params from peer URL
      const url = new URL(peer.request.url, 'http://localhost')
      const roomId = url.searchParams.get('roomId')
      const token = url.searchParams.get('token')

      if (!roomId || !token) {
        peer.send(JSON.stringify({ type: 'error', message: 'Missing roomId or token' }))
        peer.close(4001, 'Missing roomId or token')
        return
      }

      // Validate token via Better Auth session table
      const [sessionRecord] = await db
        .select()
        .from(session)
        .where(and(eq(session.token, token), gt(session.expiresAt, new Date())))

      if (!sessionRecord) {
        peer.send(JSON.stringify({ type: 'error', message: 'Invalid or expired token' }))
        peer.close(4001, 'Invalid or expired token')
        return
      }

      // Fetch user info
      const [userRecord] = await db
        .select({
          id: user.id,
          name: user.name,
          image: user.image,
          role: user.role,
          tenantId: user.tenantId,
          unitId: user.unitId,
        })
        .from(user)
        .where(eq(user.id, sessionRecord.userId))

      if (!userRecord || !userRecord.tenantId) {
        peer.send(JSON.stringify({ type: 'error', message: 'User not found or no tenant' }))
        peer.close(4003, 'User not found or no tenant')
        return
      }

      // Validate room access
      const hasAccess = await userCanAccessRoom(
        roomId,
        userRecord.id,
        userRecord.role ?? 'propietario',
        userRecord.tenantId,
        userRecord.unitId,
      )

      if (!hasAccess) {
        peer.send(JSON.stringify({ type: 'error', message: 'No access to this room' }))
        peer.close(4003, 'No access to this room')
        return
      }

      // Register peer
      addChatPeer(peer, roomId, {
        userId: userRecord.id,
        userName: userRecord.name,
        userImage: userRecord.image,
        tenantId: userRecord.tenantId,
      })

      peer.send(JSON.stringify({ type: 'connected', roomId }))
    }
    catch (error) {
      console.error('[ws-chat] open error:', error)
      peer.send(JSON.stringify({ type: 'error', message: 'Internal server error' }))
      peer.close(4500, 'Internal server error')
    }
  },

  async message(peer, message) {
    const text = message.text()

    // Keepalive
    if (text === 'ping') {
      peer.send('pong')
      return
    }

    const info = getChatPeerInfo(peer)
    if (!info) {
      peer.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }

    try {
      const parsed: unknown = JSON.parse(text)

      if (!isValidIncomingMessage(parsed)) {
        peer.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }))
        return
      }

      const content = parsed.content.trim()

      if (content.length === 0) {
        peer.send(JSON.stringify({ type: 'error', message: 'Message content cannot be empty' }))
        return
      }

      if (content.length > 1000) {
        peer.send(JSON.stringify({ type: 'error', message: 'Message too long (max 1000 characters)' }))
        return
      }

      await insertAndBroadcastMessage(info.roomId, info.userId, content)
    }
    catch {
      peer.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
    }
  },

  close(peer) {
    removeChatPeer(peer)
  },
})
