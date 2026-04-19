import type { FinancialReport } from '~~/shared/types/financial'

interface ReportsMeta {
  total: number
  page: number
  limit: number
}

export function useFinancialReports() {
  const reports = ref<FinancialReport[]>([])
  const meta = ref<ReportsMeta>({ total: 0, page: 1, limit: 10 })
  const isLoading = ref(false)
  const isUploading = ref(false)
  const error = ref<string | null>(null)

  async function fetchReports(page = 1, limit = 10) {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: FinancialReport[], meta: ReportsMeta }>(
        '/api/finance/reports',
        { params: { page, limit } },
      )
      reports.value = res.data
      meta.value = res.meta
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar reportes financieros'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function uploadReport(formData: FormData) {
    isUploading.value = true
    error.value = null
    try {
      await $fetch('/api/finance/reports/upload', {
        method: 'POST',
        body: formData,
      })
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al subir reporte'
      error.value = message
      throw err
    }
    finally {
      isUploading.value = false
    }
  }

  const totalPages = computed(() => Math.ceil(meta.value.total / meta.value.limit) || 1)

  return {
    reports,
    meta,
    isLoading,
    isUploading,
    error,
    totalPages,
    fetchReports,
    uploadReport,
  }
}
