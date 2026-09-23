import type { UserRole } from '~~/shared/types/auth'
import type { PageMeta, Paginated } from '~~/shared/types/pagination'
import type { PushStats, PushStatsStatus, PushStatsUser, PushStatsUsersQuery } from '~~/shared/types/push-stats'
import { PUSH_STATS_USERS_DEFAULT_LIMIT } from '~~/shared/lib/push-stats'

export interface PushStatsFilters {
  status: PushStatsStatus
  role: UserRole | null
  search: string
  page: number
  limit: number
}

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { message?: string } }).data
    if (data?.message) return data.message
  }
  return err instanceof Error ? err.message : fallback
}

/**
 * Adopción de notificaciones push (solo admin).
 * - stats: resumen y desglose por rol (GET /api/admin/push-stats)
 * - users: lista paginada y filtrable (GET /api/admin/push-stats/users)
 * Son dos peticiones independientes: cambiar filtros o página solo recarga la lista.
 */
export function usePushStats() {
  const stats = ref<PushStats | null>(null)
  const users = ref<PushStatsUser[]>([])
  const meta = ref<PageMeta>({ total: 0, page: 1, limit: PUSH_STATS_USERS_DEFAULT_LIMIT, hasMore: false })

  const filters = reactive<PushStatsFilters>({
    status: 'without',
    role: null,
    search: '',
    page: 1,
    limit: PUSH_STATS_USERS_DEFAULT_LIMIT,
  })

  const isLoadingStats = ref(false)
  const isLoadingUsers = ref(false)
  const statsError = ref<string | null>(null)
  const usersError = ref<string | null>(null)

  const totalPages = computed(() => Math.max(1, Math.ceil(meta.value.total / meta.value.limit)))

  async function fetchStats() {
    isLoadingStats.value = true
    statsError.value = null
    try {
      const res = await $fetch<{ data: PushStats }>('/api/admin/push-stats')
      stats.value = res.data
    }
    catch (err: unknown) {
      statsError.value = errorMessage(err, 'No se pudieron cargar las estadísticas de notificaciones')
    }
    finally {
      isLoadingStats.value = false
    }
  }

  // Descarta respuestas de peticiones anteriores (búsqueda tecleada rápido).
  let usersRequestId = 0

  async function fetchUsers() {
    const requestId = ++usersRequestId
    isLoadingUsers.value = true
    usersError.value = null
    try {
      const params: PushStatsUsersQuery = {
        status: filters.status,
        page: filters.page,
        limit: filters.limit,
      }
      if (filters.role) params.role = filters.role
      if (filters.search.trim()) params.search = filters.search.trim()

      const res = await $fetch<Paginated<PushStatsUser>>('/api/admin/push-stats/users', { params })
      if (requestId !== usersRequestId) return
      users.value = res.data
      meta.value = res.meta
    }
    catch (err: unknown) {
      if (requestId !== usersRequestId) return
      usersError.value = errorMessage(err, 'No se pudo cargar la lista de usuarios')
    }
    finally {
      if (requestId === usersRequestId) isLoadingUsers.value = false
    }
  }

  /** Cambia uno o varios filtros, vuelve a la página 1 y recarga la lista. */
  function setFilters(patch: Partial<Omit<PushStatsFilters, 'page'>>) {
    Object.assign(filters, patch)
    filters.page = 1
    return fetchUsers()
  }

  function setPage(page: number) {
    filters.page = Math.min(Math.max(1, page), totalPages.value)
    return fetchUsers()
  }

  function refresh() {
    return Promise.all([fetchStats(), fetchUsers()])
  }

  return {
    stats: readonly(stats),
    users: readonly(users),
    meta: readonly(meta),
    /** Mutable para v-model; tras cambiarlo llama setFilters({}) o fetchUsers(). */
    filters,
    totalPages,
    isLoadingStats: readonly(isLoadingStats),
    isLoadingUsers: readonly(isLoadingUsers),
    statsError: readonly(statsError),
    usersError: readonly(usersError),
    fetchStats,
    fetchUsers,
    setFilters,
    setPage,
    refresh,
  }
}
