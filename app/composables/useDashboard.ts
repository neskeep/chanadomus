export interface DashboardStats {
  openIncidents: number
  inProgressIncidents: number
  activePolls: number
  upcomingMeetings: number
  nextMeeting: { title: string; date: string } | null
  publishedAnnouncements: number
  activeProviders: number
  totalUnits: number
  unitsInDebt: number
  pendingProviders: number
  myOpenIncidents: number
  todayAccessCount: number
}

export interface DashboardTrends {
  incidentsByMonth: Array<{ month: string; count: number }>
  accessByDay: Array<{ day: string; count: number }>
  financeByMonth: Array<{ month: string; cargos: number; abonos: number }>
  financialKpis: {
    totalCargos: number
    totalAbonos: number
    collectionRate: number
    pendingBalance: number
  }
}

export function useDashboard() {
  const stats = ref<DashboardStats | null>(null)
  const trends = ref<DashboardTrends | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  async function fetchDashboard() {
    isLoading.value = true
    error.value = null
    try {
      const [statsRes, trendsRes] = await Promise.all([
        $fetch<{ data: DashboardStats }>('/api/dashboard/stats'),
        $fetch<{ data: DashboardTrends }>('/api/dashboard/trends'),
      ])
      stats.value = statsRes.data
      trends.value = trendsRes.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar dashboard'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  function exportCsv() {
    window.open('/api/dashboard/export/csv', '_blank')
  }

  function exportPdf() {
    window.open('/api/dashboard/export/pdf', '_blank')
  }

  async function refresh() {
    await fetchDashboard()
  }

  // Fetch client-side only to avoid hydration mismatch
  if (import.meta.client) {
    fetchDashboard()
  }

  return {
    stats,
    trends,
    isLoading,
    error,
    refresh,
    exportCsv,
    exportPdf,
  }
}
