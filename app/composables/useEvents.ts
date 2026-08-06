import type {
  EventSummary,
  EventDetail,
  EventStatus,
  CreateEvent,
  UpdateEvent,
} from '~~/shared/types/event'

interface EventsMeta {
  total: number
  page: number
  limit: number
}

interface FetchEventsParams {
  page?: number
  limit?: number
  status?: EventStatus
  unitId?: string
}

export function useEvents() {
  const events = ref<EventSummary[]>([])
  const meta = ref<EventsMeta>({ total: 0, page: 1, limit: 20 })
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchEvents(params: FetchEventsParams = {}) {
    isLoading.value = true
    error.value = null
    try {
      const query: Record<string, string | number> = {}
      if (params.page) query.page = params.page
      if (params.limit) query.limit = params.limit
      if (params.status) query.status = params.status
      if (params.unitId) query.unitId = params.unitId

      const res = await $fetch<{ data: EventSummary[]; meta: EventsMeta }>(
        '/api/events',
        { params: query },
      )
      events.value = res.data
      meta.value = res.meta
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al cargar eventos')
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchEvent(id: string): Promise<EventDetail> {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: EventDetail }>(`/api/events/${id}`)
      return res.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al cargar evento')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchActiveEvents(): Promise<EventSummary[]> {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: EventSummary[] }>('/api/events/active')
      return res.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al cargar eventos activos')
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function createEvent(data: CreateEvent): Promise<EventDetail> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: EventDetail }>('/api/events', {
        method: 'POST',
        body: data,
      })
      return res.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al crear evento')
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function updateEvent(id: string, data: UpdateEvent): Promise<EventDetail> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: EventDetail }>(`/api/events/${id}`, {
        method: 'PATCH',
        body: data,
      })
      return res.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al actualizar evento')
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function approveEvent(id: string): Promise<EventDetail> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: EventDetail }>(`/api/events/${id}/approve`, {
        method: 'PATCH',
      })
      return res.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al aprobar evento')
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function deleteEvent(id: string): Promise<void> {
    isSubmitting.value = true
    error.value = null
    try {
      // @ts-expect-error typed routes not yet generated for this endpoint
      await $fetch(`/api/events/${id}`, { method: 'DELETE' })
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al eliminar evento')
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  const totalPages = computed(() => Math.ceil(meta.value.total / meta.value.limit) || 1)

  return {
    events,
    meta,
    isLoading,
    isSubmitting,
    error,
    totalPages,
    fetchEvents,
    fetchEvent,
    fetchActiveEvents,
    createEvent,
    updateEvent,
    approveEvent,
    deleteEvent,
  }
}
