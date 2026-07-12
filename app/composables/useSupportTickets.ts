import type { SupportTicket, SupportTicketStatus, SupportTicketType, SupportTicketPriority } from '~~/shared/types/support'

interface SupportTicketsMeta {
  total: number
  page: number
  limit: number
}

interface FetchSupportTicketsParams {
  page?: number
  limit?: number
  status?: SupportTicketStatus
  type?: SupportTicketType
  priority?: SupportTicketPriority
}

export function useSupportTickets() {
  const tickets = ref<SupportTicket[]>([])
  const meta = ref<SupportTicketsMeta>({ total: 0, page: 1, limit: 20 })
  const isLoading = ref(false)
  const isCreating = ref(false)
  const error = ref<string | null>(null)

  async function fetchTickets(params: FetchSupportTicketsParams = {}) {
    isLoading.value = true
    error.value = null
    try {
      const query: Record<string, string | number> = {}
      if (params.page) query.page = params.page
      if (params.limit) query.limit = params.limit
      if (params.status) query.status = params.status
      if (params.type) query.type = params.type
      if (params.priority) query.priority = params.priority

      const res = await $fetch<{ data: SupportTicket[], meta: SupportTicketsMeta }>(
        '/api/support',
        { params: query },
      )
      tickets.value = res.data
      meta.value = res.meta
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar tickets'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function createTicket(formData: FormData) {
    isCreating.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: SupportTicket }>('/api/support', {
        method: 'POST',
        body: formData,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear ticket'
      error.value = message
      throw err
    }
    finally {
      isCreating.value = false
    }
  }

  const totalPages = computed(() => Math.ceil(meta.value.total / meta.value.limit) || 1)

  return {
    tickets,
    meta,
    isLoading,
    isCreating,
    error,
    totalPages,
    fetchTickets,
    createTicket,
  }
}
