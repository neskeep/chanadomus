import type { Incident, IncidentStatus } from '~~/shared/types/incident'

export function useIncidentDetail() {
  const incident = ref<Incident | null>(null)
  const isLoading = ref(false)
  const isUpdating = ref(false)
  const isDeleting = ref(false)
  const error = ref<string | null>(null)

  async function fetchIncident(id: string) {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Incident }>(`/api/incidents/${id}`)
      incident.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar incidencia'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateStatus(id: string, status: IncidentStatus, note?: string) {
    isUpdating.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Incident }>(`/api/incidents/${id}/status`, {
        method: 'PATCH',
        body: { status, note },
      })
      incident.value = res.data
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

  async function deleteIncident(id: string) {
    isDeleting.value = true
    error.value = null
    try {
      await $fetch(`/api/incidents/${id}`, { method: 'DELETE' })
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar incidencia'
      error.value = message
      throw err
    }
    finally {
      isDeleting.value = false
    }
  }

  return {
    incident,
    isLoading,
    isUpdating,
    isDeleting,
    error,
    fetchIncident,
    updateStatus,
    deleteIncident,
  }
}
