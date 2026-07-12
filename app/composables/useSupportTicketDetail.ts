import type { SupportTicket, SupportTicketStatus } from '~~/shared/types/support'

export function useSupportTicketDetail() {
  const ticket = ref<SupportTicket | null>(null)
  const isLoading = ref(false)
  const isUpdating = ref(false)
  const isDeleting = ref(false)
  const error = ref<string | null>(null)

  async function fetchTicket(id: string) {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: SupportTicket }>(`/api/support/${id}`)
      ticket.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar ticket'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateStatus(id: string, status: SupportTicketStatus, note?: string, resolvedInVersion?: string) {
    isUpdating.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: SupportTicket }>(`/api/support/${id}/status`, {
        method: 'PATCH',
        body: { status, note, resolvedInVersion },
      })
      ticket.value = res.data
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar estado'
      error.value = message
      throw err
    }
    finally {
      isUpdating.value = false
    }
  }

  async function deleteTicket(id: string) {
    isDeleting.value = true
    error.value = null
    try {
      await $fetch(`/api/support/${id}`, { method: 'DELETE' })
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar ticket'
      error.value = message
      throw err
    }
    finally {
      isDeleting.value = false
    }
  }

  return {
    ticket,
    isLoading,
    isUpdating,
    isDeleting,
    error,
    fetchTicket,
    updateStatus,
    deleteTicket,
  }
}
