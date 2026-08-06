import type { EventGuest, GuestStatus } from '~~/shared/types/event'

export function useEventCheckin(eventId: Ref<string> | string) {
  const id = typeof eventId === 'string' ? eventId : eventId

  const guests = ref<EventGuest[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const statusFilter = ref<GuestStatus | 'todos'>('todos')

  // Stats computed from local state
  const stats = computed(() => {
    const all = guests.value
    const inside = all.filter(g => g.status === 'dentro').length
    const pending = all.filter(g => g.status === 'pendiente').length
    const exited = all.filter(g => g.status === 'salio').length
    return { total: all.length, inside, pending, exited }
  })

  // Client-side filtered guests — instant, no network
  const filteredGuests = computed(() => {
    let list = guests.value

    // Filter by status tab
    if (statusFilter.value !== 'todos') {
      list = list.filter(g => g.status === statusFilter.value)
    }

    // Filter by search query
    const q = searchQuery.value.trim().toLowerCase()
    if (q) {
      list = list.filter(g =>
        g.name.toLowerCase().includes(q)
        || (g.document && g.document.toLowerCase().includes(q))
        || (g.vehiclePlate && g.vehiclePlate.toLowerCase().includes(q)),
      )
    }

    // Sort alphabetically within each group
    return list.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  })

  async function loadGuests() {
    isLoading.value = true
    error.value = null
    try {
      const eid = toValue(id)
      const res = await $fetch<{ data: EventGuest[] }>(`/api/events/${eid}/guests`)
      guests.value = res.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al cargar invitados')
    }
    finally {
      isLoading.value = false
    }
  }

  async function checkin(guestId: string) {
    const eid = toValue(id)
    const guest = guests.value.find(g => g.id === guestId)
    if (!guest || guest.status !== 'pendiente') return

    // Optimistic update
    const prevStatus = guest.status
    const prevCheckedInAt = guest.checkedInAt
    guest.status = 'dentro'
    guest.checkedInAt = new Date().toISOString()

    try {
      const res = await $fetch<{ data: EventGuest }>(
        `/api/events/${eid}/checkin/${guestId}`,
        { method: 'POST' },
      )
      // Apply server response
      const idx = guests.value.findIndex(g => g.id === guestId)
      if (idx !== -1) guests.value[idx] = res.data
    }
    catch (err: unknown) {
      // Revert optimistic update
      guest.status = prevStatus
      guest.checkedInAt = prevCheckedInAt
      error.value = getApiErrorMessage(err, 'Error al registrar entrada')
    }
  }

  async function checkout(guestId: string) {
    const eid = toValue(id)
    const guest = guests.value.find(g => g.id === guestId)
    if (!guest || guest.status !== 'dentro') return

    // Optimistic update
    const prevStatus = guest.status
    const prevCheckedOutAt = guest.checkedOutAt
    guest.status = 'salio'
    guest.checkedOutAt = new Date().toISOString()

    try {
      const res = await $fetch<{ data: EventGuest }>(
        `/api/events/${eid}/checkout/${guestId}`,
        { method: 'POST' },
      )
      // Apply server response
      const idx = guests.value.findIndex(g => g.id === guestId)
      if (idx !== -1) guests.value[idx] = res.data
    }
    catch (err: unknown) {
      // Revert optimistic update
      guest.status = prevStatus
      guest.checkedOutAt = prevCheckedOutAt
      error.value = getApiErrorMessage(err, 'Error al registrar salida')
    }
  }

  // Update a single guest from external source (e.g. WebSocket)
  function updateGuest(updatedGuest: EventGuest) {
    const idx = guests.value.findIndex(g => g.id === updatedGuest.id)
    if (idx !== -1) {
      guests.value[idx] = updatedGuest
    }
  }

  return {
    guests,
    isLoading,
    error,
    searchQuery,
    statusFilter,
    stats,
    filteredGuests,
    loadGuests,
    checkin,
    checkout,
    updateGuest,
  }
}
