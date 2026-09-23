import type { EventGuest, GuestStatus } from '~~/shared/types/event'

/**
 * Check-in / check-out de invitados de un evento (pantalla de vigilancia).
 *
 * Protecciones contra toques repetidos (ticket ea2a0d07, 15 salidas en 10 s):
 * - Sin update optimista: el estado cambia solo cuando el servidor confirma.
 * - Bloqueo por invitado mientras su peticion esta en curso (`isGuestBusy`).
 * - Bloqueo global breve: mientras hay una peticion en curso y ACTION_COOLDOWN_MS
 *   despues, se ignoran nuevos toques en cualquier fila.
 * - Posicion estable: el invitado recien cambiado sigue visible en la pestana
 *   actual durante STICKY_MS (la lista no se desplaza bajo el dedo) y su fila no
 *   muestra botones de accion (`isRecentlyChanged`).
 * - `filteredGuests` ordena una copia, nunca el array reactivo.
 */
const ACTION_COOLDOWN_MS = 600
const STICKY_MS = 4000

export type GuestAction = 'checkin' | 'checkout' | 'undo-checkout'

export function useEventCheckin(eventId: MaybeRefOrGetter<string>) {
  const guests = ref<EventGuest[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const statusFilter = ref<GuestStatus | 'todos'>('todos')

  const busyIds = ref(new Set<string>())
  const recentIds = ref(new Set<string>())
  let lockedUntil = 0
  const stickyTimers = new Map<string, ReturnType<typeof setTimeout>>()

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

    // Filter by status tab (los recien cambiados se mantienen en su sitio un momento)
    if (statusFilter.value !== 'todos') {
      const status = statusFilter.value
      list = list.filter(g => g.status === status || recentIds.value.has(g.id))
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

    // Orden alfabetico sobre una copia: ordenar in place reordena `guests` y la lista salta
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  })

  function isGuestBusy(guestId: string): boolean {
    return busyIds.value.has(guestId)
  }

  function isRecentlyChanged(guestId: string): boolean {
    return recentIds.value.has(guestId)
  }

  function markRecent(guestId: string) {
    const prev = stickyTimers.get(guestId)
    if (prev) clearTimeout(prev)
    recentIds.value.add(guestId)
    stickyTimers.set(guestId, setTimeout(() => {
      recentIds.value.delete(guestId)
      stickyTimers.delete(guestId)
    }, STICKY_MS))
  }

  function replaceGuest(updated: EventGuest) {
    const idx = guests.value.findIndex(g => g.id === updated.id)
    if (idx !== -1) guests.value[idx] = updated
  }

  async function loadGuests() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: EventGuest[] }>(`/api/events/${toValue(eventId)}/guests`)
      guests.value = res.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al cargar invitados')
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Ejecuta una accion sobre un invitado con los bloqueos anti doble toque.
   * Devuelve el invitado actualizado, o null si el toque se ignoro por bloqueo.
   * Lanza el error de la API para que la vista lo muestre.
   */
  async function runGuestAction(guestId: string, action: GuestAction): Promise<EventGuest | null> {
    if (busyIds.value.size > 0 || Date.now() < lockedUntil) return null
    if (action !== 'undo-checkout' && recentIds.value.has(guestId)) return null

    const guest = guests.value.find(g => g.id === guestId)
    const expected: GuestStatus = action === 'checkin' ? 'pendiente' : action === 'checkout' ? 'dentro' : 'salio'
    if (!guest || guest.status !== expected) return null

    const eid = toValue(eventId)
    const request = action === 'checkin'
      ? { url: `/api/events/${eid}/checkin/${guestId}`, method: 'POST' as const }
      : { url: `/api/events/${eid}/checkout/${guestId}`, method: action === 'checkout' ? 'POST' as const : 'DELETE' as const }

    busyIds.value.add(guestId)
    try {
      const res = await $fetch<{ data: EventGuest }>(request.url, { method: request.method })
      replaceGuest(res.data)
      markRecent(guestId)
      return res.data
    }
    finally {
      busyIds.value.delete(guestId)
      lockedUntil = Date.now() + ACTION_COOLDOWN_MS
    }
  }

  const checkin = (guestId: string) => runGuestAction(guestId, 'checkin')
  const checkout = (guestId: string) => runGuestAction(guestId, 'checkout')
  const undoCheckout = (guestId: string) => runGuestAction(guestId, 'undo-checkout')

  // Update a single guest from external source (e.g. WebSocket)
  function updateGuest(updatedGuest: EventGuest) {
    replaceGuest(updatedGuest)
  }

  onScopeDispose(() => {
    stickyTimers.forEach(t => clearTimeout(t))
    stickyTimers.clear()
  })

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
    undoCheckout,
    isGuestBusy,
    isRecentlyChanged,
    updateGuest,
  }
}
