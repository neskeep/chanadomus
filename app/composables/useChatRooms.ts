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

  const generalRooms = computed(() =>
    rooms.value.filter(r => r.type === 'general'),
  )

  const unitRooms = computed(() =>
    rooms.value.filter(r => r.type === 'unit'),
  )

  const adminRooms = computed(() =>
    rooms.value.filter(r => r.type === 'admin'),
  )

  const vigilanciaRooms = computed(() =>
    rooms.value.filter(r => r.type === 'vigilancia'),
  )

  function getRoomById(id: string): ChatRoom | undefined {
    return rooms.value.find(r => r.id === id)
  }

  return {
    rooms,
    isLoading,
    error,
    generalRooms,
    unitRooms,
    adminRooms,
    vigilanciaRooms,
    fetchRooms,
    getRoomById,
  }
}
