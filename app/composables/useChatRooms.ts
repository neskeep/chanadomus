import type { ChatRoom } from '~~/shared/types/chat'

export function useChatRooms() {
  const rooms = ref<ChatRoom[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

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

  const groupRooms = computed(() =>
    rooms.value.filter(r => r.type !== 'direct' && r.type !== 'unit'),
  )

  const directRooms = computed(() =>
    rooms.value
      .filter(r => r.type === 'direct')
      .sort((a, b) => {
        const ta = a.lastMessage?.createdAt ?? a.createdAt
        const tb = b.lastMessage?.createdAt ?? b.createdAt
        return tb.localeCompare(ta)
      }),
  )

  function getRoomById(id: string): ChatRoom | undefined {
    return rooms.value.find(r => r.id === id)
  }

  return {
    rooms,
    isLoading,
    error,
    groupRooms,
    directRooms,
    fetchRooms,
    getRoomById,
  }
}
