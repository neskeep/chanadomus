import type { Incident, IncidentStatus, IncidentPriority } from '~~/shared/types/incident'

interface IncidentsMeta {
  total: number
  page: number
  limit: number
}

interface FetchIncidentsParams {
  page?: number
  limit?: number
  status?: IncidentStatus
  priority?: IncidentPriority
  unitId?: string
  mine?: boolean
}

export function useIncidents() {
  const incidents = ref<Incident[]>([])
  const meta = ref<IncidentsMeta>({ total: 0, page: 1, limit: 20 })
  const isLoading = ref(false)
  const isCreating = ref(false)
  const error = ref<string | null>(null)

  async function fetchIncidents(params: FetchIncidentsParams = {}) {
    isLoading.value = true
    error.value = null
    try {
      const query: Record<string, string | number | boolean> = {}
      if (params.page) query.page = params.page
      if (params.limit) query.limit = params.limit
      if (params.status) query.status = params.status
      if (params.priority) query.priority = params.priority
      if (params.unitId) query.unit_id = params.unitId
      if (params.mine) query.mine = true

      const res = await $fetch<{ data: Incident[], meta: IncidentsMeta }>(
        '/api/incidents',
        { params: query },
      )
      incidents.value = res.data
      meta.value = res.meta
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar incidencias'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function createIncident(formData: FormData) {
    isCreating.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Incident }>('/api/incidents', {
        method: 'POST',
        body: formData,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear incidencia'
      error.value = message
      throw err
    }
    finally {
      isCreating.value = false
    }
  }

  const totalPages = computed(() => Math.ceil(meta.value.total / meta.value.limit) || 1)

  return {
    incidents,
    meta,
    isLoading,
    isCreating,
    error,
    totalPages,
    fetchIncidents,
    createIncident,
  }
}
