import type {
  Meeting,
  MeetingType,
  MeetingStatus,
  CreateMeeting,
  UpdateMeeting,
} from '~~/shared/types/meeting'

interface MeetingsMeta {
  total: number
  page: number
  limit: number
}

interface FetchMeetingsParams {
  page?: number
  limit?: number
  type?: MeetingType
  status?: MeetingStatus
  from?: string
  to?: string
}

export function useMeetings() {
  const meetings = ref<Meeting[]>([])
  const meta = ref<MeetingsMeta>({ total: 0, page: 1, limit: 20 })
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchMeetings(params: FetchMeetingsParams = {}) {
    isLoading.value = true
    error.value = null
    try {
      const query: Record<string, string | number> = {}
      if (params.page) query.page = params.page
      if (params.limit) query.limit = params.limit
      if (params.type) query.type = params.type
      if (params.status) query.status = params.status
      if (params.from) query.from = params.from
      if (params.to) query.to = params.to

      const res = await $fetch<{ data: Meeting[]; meta: MeetingsMeta }>(
        '/api/meetings',
        { params: query },
      )
      meetings.value = res.data
      meta.value = res.meta
    }
    catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Error al cargar reuniones')
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchMeeting(id: string): Promise<Meeting> {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Meeting }>(`/api/meetings/${id}`)
      return res.data
    }
    catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Error al cargar reunion')
      error.value = message
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function createMeeting(data: CreateMeeting): Promise<Meeting> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Meeting }>('/api/meetings', {
        method: 'POST',
        body: data,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Error al crear reunion')
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function updateMeeting(id: string, data: UpdateMeeting): Promise<Meeting> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Meeting }>(`/api/meetings/${id}`, {
        method: 'PATCH',
        body: data,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Error al actualizar reunion')
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function deleteMeeting(id: string): Promise<void> {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
      })
    }
    catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Error al eliminar reunion')
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  const totalPages = computed(() => Math.ceil(meta.value.total / meta.value.limit) || 1)

  return {
    meetings,
    meta,
    isLoading,
    isSubmitting,
    error,
    totalPages,
    fetchMeetings,
    fetchMeeting,
    createMeeting,
    updateMeeting,
    deleteMeeting,
  }
}
