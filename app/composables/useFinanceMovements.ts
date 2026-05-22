import type { MovementWithUnit } from '~~/shared/types/financial'

export function useFinanceMovements() {
  const movements = ref<MovementWithUnit[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<{ page: number; limit: number; total: number; totalPages: number }>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  })

  async function fetchMovements(params?: { page?: number; from?: string; to?: string; type?: string }) {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{
        data: MovementWithUnit[]
        meta: typeof meta.value
      }>('/api/finance/movements', { query: params })
      movements.value = res.data
      meta.value = res.meta
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al cargar movimientos'
    }
    finally {
      isLoading.value = false
    }
  }

  const totalPages = computed(() => meta.value.totalPages)

  return {
    movements,
    isLoading,
    error,
    meta,
    totalPages,
    fetchMovements,
  }
}
