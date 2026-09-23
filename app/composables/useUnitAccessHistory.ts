import type { AccessEvent, UnitAccessHistoryMeta, UnitAccessRange } from '~~/shared/types/access'
import { UNIT_ACCESS_DEFAULT_LIMIT, UNIT_ACCESS_DEFAULT_RANGE } from '~~/shared/lib/access-history-range'

/**
 * Accesos registrados a la vivienda del usuario (propietario o conserje),
 * GET /api/my-unit/access-history. Distinto de useAccessHistory (vista de staff).
 * - fetchHistory(range): primera página del rango (reemplaza la lista)
 * - loadMore(): añade la siguiente página ("cargar más")
 */
export function useUnitAccessHistory() {
  const events = ref<AccessEvent[]>([])
  const range = ref<UnitAccessRange>(UNIT_ACCESS_DEFAULT_RANGE)
  const meta = ref<UnitAccessHistoryMeta | null>(null)
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const error = ref<string | null>(null)

  const hasMore = computed(() => meta.value?.hasMore ?? false)
  const total = computed(() => meta.value?.total ?? 0)

  let requestId = 0

  async function requestPage(r: UnitAccessRange, page: number, limit: number) {
    return $fetch<{ data: AccessEvent[]; meta: UnitAccessHistoryMeta }>('/api/my-unit/access-history', {
      query: { range: r, page, limit },
    })
  }

  async function fetchHistory(r: UnitAccessRange = range.value, limit = UNIT_ACCESS_DEFAULT_LIMIT) {
    const id = ++requestId
    range.value = r
    isLoading.value = true
    error.value = null
    try {
      const result = await requestPage(r, 1, limit)
      if (id !== requestId) return
      events.value = result.data
      meta.value = result.meta
    }
    catch (err: unknown) {
      if (id !== requestId) return
      error.value = getApiErrorMessage(err, 'Error al cargar los accesos')
    }
    finally {
      if (id === requestId) isLoading.value = false
    }
  }

  async function loadMore() {
    const current = meta.value
    if (!current?.hasMore || isLoading.value || isLoadingMore.value) return
    const id = requestId
    isLoadingMore.value = true
    error.value = null
    try {
      const result = await requestPage(current.range, current.page + 1, current.limit)
      if (id !== requestId) return
      // Llegan accesos nuevos mientras se pagina: evita duplicados por desplazamiento
      const seen = new Set(events.value.map(e => e.id))
      events.value = [...events.value, ...result.data.filter(e => !seen.has(e.id))]
      meta.value = result.meta
    }
    catch (err: unknown) {
      if (id !== requestId) return
      error.value = getApiErrorMessage(err, 'Error al cargar más accesos')
    }
    finally {
      isLoadingMore.value = false
    }
  }

  return {
    events,
    range,
    meta,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    fetchHistory,
    loadMore,
  }
}
