import type { ChatRoom } from '~~/shared/types/chat'

export function useChatRooms() {
  const rooms = useState<ChatRoom[]>('chat-rooms', () => [])
  const isLoading = useState<boolean>('chat-rooms-loading', () => false)
  const error = useState<string | null>('chat-rooms-error', () => null)

  async function fetchRooms() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: ChatRoom[] }>('/api/chat/rooms')
      rooms.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar salas'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  function sortByLastActivity(a: ChatRoom, b: ChatRoom): number {
    // Unread rooms first
    const aUnread = (a.unreadCount ?? 0) > 0 ? 1 : 0
    const bUnread = (b.unreadCount ?? 0) > 0 ? 1 : 0
    if (bUnread !== aUnread) return bUnread - aUnread

    // Then by last activity (most recent first)
    const ta = a.lastMessage?.createdAt ?? a.createdAt
    const tb = b.lastMessage?.createdAt ?? b.createdAt
    return tb.localeCompare(ta)
  }

  const groupRooms = computed(() =>
    rooms.value
      .filter(r => r.type !== 'direct' && r.type !== 'unit')
      .sort(sortByLastActivity),
  )

  const directRooms = computed(() =>
    rooms.value
      .filter(r => r.type === 'direct' && r.lastMessage)
      .sort(sortByLastActivity),
  )

  function getRoomById(id: string): ChatRoom | undefined {
    return rooms.value.find(r => r.id === id)
  }

  function updateRoomLastMessage(
    roomId: string,
    message: { content: string, createdAt: string, userName: string },
    isActiveRoom: boolean,
  ) {
    const index = rooms.value.findIndex(r => r.id === roomId)
    if (index === -1) return

    const room = rooms.value[index]
    if (!room) return

    const updatedRoom: ChatRoom = {
      ...room,
      lastMessage: {
        content: message.content,
        createdAt: message.createdAt,
        userName: message.userName,
      },
      unreadCount: isActiveRoom ? (room.unreadCount ?? 0) : (room.unreadCount ?? 0) + 1,
    }

    // Replace the room in the array to trigger reactivity
    rooms.value = [
      ...rooms.value.slice(0, index),
      updatedRoom,
      ...rooms.value.slice(index + 1),
    ]
  }

  function clearUnreadCount(roomId: string) {
    const index = rooms.value.findIndex(r => r.id === roomId)
    if (index === -1) return

    const room = rooms.value[index]
    if (!room || (room.unreadCount ?? 0) === 0) return

    const updatedRoom: ChatRoom = {
      ...room,
      unreadCount: 0,
    }

    rooms.value = [
      ...rooms.value.slice(0, index),
      updatedRoom,
      ...rooms.value.slice(index + 1),
    ]
  }

  return {
    rooms,
    isLoading,
    error,
    groupRooms,
    directRooms,
    fetchRooms,
    getRoomById,
    updateRoomLastMessage,
    clearUnreadCount,
  }
}
