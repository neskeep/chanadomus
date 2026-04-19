import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { eq } from 'drizzle-orm'
import { auth } from '~~/server/lib/auth'
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
      // Extract roomId from URL query params
      const url = new URL(peer.request?.url || '', 'http://localhost')
      const roomId = url.searchParams.get('roomId')

      if (!roomId) {
        peer.send(JSON.stringify({ type: 'error', message: 'Missing roomId' }))
        peer.close(4001, 'Missing roomId')
        return
      }

      // Validate session via Better Auth API using upgrade request headers
      const headers = peer.request?.headers
      if (!headers) {
        peer.send(JSON.stringify({ type: 'error', message: 'No request headers' }))
        peer.close(4001, 'No request headers')
        return
      }

      const sessionResult = await auth.api.getSession({ headers })

      if (!sessionResult?.session || !sessionResult?.user) {
        peer.send(JSON.stringify({ type: 'error', message: 'Session invalida o expirada' }))
        peer.close(4001, 'Invalid or expired session')
        return
      }

      // Fetch extended user info (tenantId, unitId, role)
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
        .where(eq(user.id, sessionResult.user.id))

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
