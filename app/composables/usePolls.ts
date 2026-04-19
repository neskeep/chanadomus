import type { Poll, PollStatus, PollVote } from '~~/shared/types/poll'

interface PollsMeta {
  total: number
  page: number
  limit: number
}

interface FetchPollsParams {
  page?: number
  limit?: number
  status?: PollStatus
}

interface CreatePollPayload {
  title: string
  description?: string
  type?: 'single' | 'multiple'
  status?: PollStatus
  deadline?: string | null
  options: string[]
}

export function usePolls() {
  const polls = ref<Poll[]>([])
  const meta = ref<PollsMeta>({ total: 0, page: 1, limit: 20 })
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchPolls(params: FetchPollsParams = {}) {
    isLoading.value = true
    error.value = null
    try {
      const query: Record<string, string | number> = {}
      if (params.page) query.page = params.page
      if (params.limit) query.limit = params.limit
      if (params.status) query.status = params.status

      const res = await $fetch<{ data: Poll[]; meta: PollsMeta }>(
        '/api/polls',
        { params: query },
      )
      polls.value = res.data
      meta.value = res.meta
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar votaciones'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchPoll(id: string): Promise<Poll> {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Poll }>(`/api/polls/${id}`)
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar votacion'
      error.value = message
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function createPoll(payload: CreatePollPayload): Promise<Poll> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Poll }>('/api/polls', {
        method: 'POST',
        body: payload,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear votacion'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function updatePoll(id: string, data: Partial<Pick<Poll, 'title' | 'description' | 'status' | 'deadline'>>): Promise<Poll> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Poll }>(`/api/polls/${id}`, {
        method: 'PATCH',
        body: data,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar votacion'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function publishPoll(id: string): Promise<Poll> {
    return updatePoll(id, { status: 'active' })
  }

  async function closePoll(id: string): Promise<Poll> {
    return updatePoll(id, { status: 'closed' })
  }

  async function deletePoll(id: string): Promise<void> {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/polls/${id}`, {
        method: 'DELETE',
      })
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar votacion'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function vote(pollId: string, optionId: string): Promise<PollVote> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: PollVote }>(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        body: { optionId },
      })
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al votar'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  const totalPages = computed(() => Math.ceil(meta.value.total / meta.value.limit) || 1)

  return {
    polls,
    meta,
    isLoading,
    isSubmitting,
    error,
    totalPages,
    fetchPolls,
    fetchPoll,
    createPoll,
    updatePoll,
    publishPoll,
    closePoll,
    deletePoll,
    vote,
  }
}
