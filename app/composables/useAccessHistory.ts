import type { AccessEvent, AccessResult, EntryType } from '~~/shared/types/access'

interface HistoryFilters {
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD
  result: AccessResult | ''
  entryType: EntryType | ''
  search: string
  unitId: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function useAccessHistory() {
  const events = ref<AccessEvent[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  // Default: last 7 days (fechas del condominio, no UTC)
  const { today, daysAgo } = useLocalDate()

  const filters = ref<HistoryFilters>({
    from: daysAgo(7),
    to: today(),
    result: '',
    entryType: '',
    search: '',
    unitId: '',
  })

  async function fetchHistory(page = 1) {
    isLoading.value = true
    error.value = null
    try {
      const params: Record<string, string | number> = {
        from: filters.value.from,
        to: filters.value.to,
        page,
        limit: pagination.value.limit,
      }
      if (filters.value.result) params.result = filters.value.result
      if (filters.value.entryType) params.entryType = filters.value.entryType
      if (filters.value.search.trim()) params.search = filters.value.search.trim()
      if (filters.value.unitId) params.unitId = filters.value.unitId

      const res = await $fetch<{
        data: AccessEvent[]
        pagination: PaginationInfo
      }>('/api/access/history', { params })

      events.value = res.data
      pagination.value = res.pagination
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al cargar historial'
    }
    finally {
      isLoading.value = false
    }
  }

  function goToPage(page: number) {
    if (page < 1 || page > pagination.value.totalPages) return
    fetchHistory(page)
  }

  function applyFilters() {
    fetchHistory(1)
  }

  function resetFilters() {
    filters.value = {
      from: daysAgo(7),
      to: today(),
      result: '',
      entryType: '',
      search: '',
      unitId: '',
    }
    fetchHistory(1)
  }

  return {
    events,
    isLoading,
    error,
    filters,
    pagination,
    fetchHistory,
    goToPage,
    applyFilters,
    resetFilters,
  }
}
