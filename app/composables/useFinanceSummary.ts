import type { UnitSummary } from '~~/shared/types/financial'

interface FinanceTotals {
  totalCobrado: number
  totalCargado: number
  pendiente: number
}

export function useFinanceSummary() {
  const summaries = ref<UnitSummary[]>([])
  const totals = ref<FinanceTotals>({ totalCobrado: 0, totalCargado: 0, pendiente: 0 })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSummary(params?: { from?: string, to?: string }) {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: UnitSummary[], totals: FinanceTotals }>('/api/finance/summary', {
        query: params,
      })
      summaries.value = res.data
      totals.value = res.totals
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar resumen financiero'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  const totalUnits = computed(() => summaries.value.length)
  const totalRanchos = computed(() => summaries.value.filter(s => s.unitNumber.startsWith('R-')).length)
  const totalParcelas = computed(() => summaries.value.filter(s => s.unitNumber.startsWith('P-')).length)
  const totalInDebt = computed(() => summaries.value.filter(s => s.isInDebt).length)

  return {
    summaries,
    totals,
    isLoading,
    error,
    totalUnits,
    totalRanchos,
    totalParcelas,
    totalInDebt,
    fetchSummary,
  }
}
