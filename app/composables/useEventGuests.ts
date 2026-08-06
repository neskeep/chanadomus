import type {
  EventGuest,
  GuestStatus,
  CreateGuest,
  BulkImportResult,
} from '~~/shared/types/event'

export function useEventGuests(eventId: Ref<string> | string) {
  const id = typeof eventId === 'string' ? eventId : eventId

  const guests = ref<EventGuest[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchGuests(params?: { search?: string; status?: GuestStatus }) {
    isLoading.value = true
    error.value = null
    try {
      const eid = toValue(id)
      const query: Record<string, string> = {}
      if (params?.search) query.search = params.search
      if (params?.status) query.status = params.status

      const res = await $fetch<{ data: EventGuest[] }>(
        `/api/events/${eid}/guests`,
        { params: query },
      )
      guests.value = res.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al cargar invitados')
    }
    finally {
      isLoading.value = false
    }
  }

  async function addGuests(newGuests: CreateGuest[]): Promise<{ added: number; duplicates: number }> {
    isSubmitting.value = true
    error.value = null
    try {
      const eid = toValue(id)
      const res = await $fetch<{ data: EventGuest[]; added: number; duplicates: number }>(
        `/api/events/${eid}/guests`,
        { method: 'POST', body: { guests: newGuests } },
      )
      // Append new guests to local list
      guests.value = [...guests.value, ...res.data]
      return { added: res.added, duplicates: res.duplicates }
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al agregar invitados')
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function bulkImport(text: string): Promise<BulkImportResult> {
    isSubmitting.value = true
    error.value = null
    try {
      const eid = toValue(id)
      const res = await $fetch<{ data: BulkImportResult }>(
        `/api/events/${eid}/guests/bulk`,
        { method: 'POST', body: { text } },
      )
      // Refresh full list after bulk import
      await fetchGuests()
      return res.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al importar invitados')
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function removeGuest(guestId: string): Promise<void> {
    isSubmitting.value = true
    error.value = null
    try {
      const eid = toValue(id)
      await $fetch(`/api/events/${eid}/guests/${guestId}`, { method: 'DELETE' })
      guests.value = guests.value.filter(g => g.id !== guestId)
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al eliminar invitado')
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    guests,
    isLoading,
    isSubmitting,
    error,
    fetchGuests,
    addGuests,
    bulkImport,
    removeGuest,
  }
}
