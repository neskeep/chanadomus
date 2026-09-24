import type { PaginationMeta, Paginated } from '~~/shared/types/pagination'
import type {
  MembershipClosing,
  MembershipClosingDetail,
  MembershipClosingUnit,
  MembershipRate,
  MembershipRateInput,
  MembershipSummary,
  MembershipTier,
  MembershipUnit,
  MembershipUnitKind,
  MembershipUnitsQuery,
} from '~~/shared/types/membership'
import { MEMBERSHIP_UNITS_DEFAULT_LIMIT } from '~~/shared/lib/membership'

/**
 * Fila que pinta MembershipUnitsTable. Normaliza la unidad en vivo y la de un cierre
 * (la de cierre no trae contexto de uso: `context` es null).
 */
export interface MembershipTableRow {
  id: string
  number: string
  label: string | null
  kind: MembershipUnitKind
  isActive: boolean
  tier: MembershipTier
  rate: number | null
  reasons: string
  context: { accesses30d: number, financialMovements: number, balance: number } | null
}

export function membershipRowFromUnit(unit: MembershipUnit): MembershipTableRow {
  return {
    id: unit.unitId,
    number: unit.number,
    label: unit.label,
    kind: unit.kind,
    isActive: unit.isActive,
    tier: unit.tier,
    rate: unit.rate,
    reasons: unit.reasons,
    context: {
      accesses30d: unit.accesses30d,
      financialMovements: unit.financialMovements,
      balance: unit.balance,
    },
  }
}

export function membershipRowFromClosingUnit(unit: MembershipClosingUnit): MembershipTableRow {
  return {
    id: unit.unitId,
    number: unit.unitNumber,
    label: unit.unitLabel,
    kind: unit.unitKind,
    isActive: unit.isActive,
    tier: unit.tier,
    rate: unit.rate,
    reasons: unit.reasons,
    context: null,
  }
}

/** Abre el CSV del mes en curso (sin periodo) o de un cierre, como en finanzas. */
export function openMembershipExport(period?: string) {
  const query = period ? `?period=${encodeURIComponent(period)}` : ''
  window.open(`/api/admin/membership/export${query}`, '_blank')
}

/** Periodo YYYY-MM anterior. */
export function previousMembershipPeriod(period: string): string {
  const [y, m] = period.split('-').map(Number) as [number, number]
  const date = new Date(Date.UTC(y, m - 2, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export interface MembershipFilters {
  tier: MembershipTier | null
  kind: MembershipUnitKind | null
  active: boolean | null
  search: string
  page: number
  limit: number
}

/**
 * Membresía en vivo (admin):
 * - summary: resumen del mes en curso (GET /api/admin/membership)
 * - units: lista paginada y filtrable (GET /api/admin/membership/units)
 * Cambiar filtros o página solo recarga la lista.
 */
export function useMembership() {
  const summary = ref<MembershipSummary | null>(null)
  const units = ref<MembershipUnit[]>([])
  const meta = ref<PaginationMeta>({ total: 0, page: 1, limit: MEMBERSHIP_UNITS_DEFAULT_LIMIT, hasMore: false })

  const filters = reactive<MembershipFilters>({
    tier: null,
    kind: null,
    active: null,
    search: '',
    page: 1,
    limit: MEMBERSHIP_UNITS_DEFAULT_LIMIT,
  })

  const isLoadingSummary = ref(false)
  const isLoadingUnits = ref(false)
  const hasFetchedUnits = ref(false)
  const summaryError = ref<string | null>(null)
  const unitsError = ref<string | null>(null)

  const totalPages = computed(() => Math.max(1, Math.ceil(meta.value.total / meta.value.limit)))
  const rows = computed(() => units.value.map(membershipRowFromUnit))
  const activeFilterCount = computed(() =>
    [filters.tier, filters.kind, filters.active].filter(value => value !== null).length,
  )
  const hasFilters = computed(() => activeFilterCount.value > 0 || filters.search.trim() !== '')

  async function fetchSummary() {
    isLoadingSummary.value = true
    summaryError.value = null
    try {
      const res = await $fetch<{ data: MembershipSummary }>('/api/admin/membership')
      summary.value = res.data
    }
    catch (err: unknown) {
      summaryError.value = getApiErrorMessage(err, 'No se pudo cargar el resumen de la membresía')
    }
    finally {
      isLoadingSummary.value = false
    }
  }

  // Descarta respuestas de peticiones anteriores (búsqueda tecleada rápido).
  let unitsRequestId = 0

  async function fetchUnits() {
    const requestId = ++unitsRequestId
    isLoadingUnits.value = true
    unitsError.value = null
    try {
      const params: MembershipUnitsQuery = { page: filters.page, limit: filters.limit }
      if (filters.tier) params.tier = filters.tier
      if (filters.kind) params.kind = filters.kind
      if (filters.active !== null) params.active = filters.active
      if (filters.search.trim()) params.search = filters.search.trim()

      const res = await $fetch<Paginated<MembershipUnit>>('/api/admin/membership/units', { params })
      if (requestId !== unitsRequestId) return
      units.value = res.data
      meta.value = res.meta
    }
    catch (err: unknown) {
      if (requestId !== unitsRequestId) return
      unitsError.value = getApiErrorMessage(err, 'No se pudo cargar la lista de unidades')
    }
    finally {
      if (requestId === unitsRequestId) {
        isLoadingUnits.value = false
        hasFetchedUnits.value = true
      }
    }
  }

  /** Cambia uno o varios filtros, vuelve a la página 1 y recarga la lista. */
  function setFilters(patch: Partial<Omit<MembershipFilters, 'page'>>) {
    Object.assign(filters, patch)
    filters.page = 1
    return fetchUnits()
  }

  function setPage(page: number) {
    filters.page = Math.min(Math.max(1, page), totalPages.value)
    return fetchUnits()
  }

  function clearFilters() {
    filters.search = ''
    return setFilters({ tier: null, kind: null, active: null })
  }

  function refresh() {
    return Promise.all([fetchSummary(), fetchUnits()])
  }

  return {
    summary: readonly(summary),
    rows,
    meta: readonly(meta),
    /** Mutable para v-model; tras cambiarlo llama setFilters({}) o fetchUnits(). */
    filters,
    totalPages,
    activeFilterCount,
    hasFilters,
    isLoadingSummary: readonly(isLoadingSummary),
    isLoadingUnits: readonly(isLoadingUnits),
    hasFetchedUnits: readonly(hasFetchedUnits),
    summaryError: readonly(summaryError),
    unitsError: readonly(unitsError),
    fetchSummary,
    fetchUnits,
    setFilters,
    setPage,
    clearFilters,
    refresh,
  }
}

/** Cierres mensuales: lista, detalle y cierre manual (este último solo superadmin). */
export function useMembershipClosings() {
  const closings = ref<MembershipClosing[]>([])
  const detail = ref<MembershipClosingDetail | null>(null)
  const isLoading = ref(false)
  const hasFetched = ref(false)
  const isClosing = ref(false)
  const error = ref<string | null>(null)
  const notFound = ref(false)

  async function fetchClosings() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: MembershipClosing[] }>('/api/admin/membership/closings')
      closings.value = res.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'No se pudieron cargar los cierres')
    }
    finally {
      isLoading.value = false
      hasFetched.value = true
    }
  }

  async function fetchDetail(period: string) {
    isLoading.value = true
    error.value = null
    notFound.value = false
    try {
      const res = await $fetch<{ data: MembershipClosingDetail }>(`/api/admin/membership/closings/${encodeURIComponent(period)}`)
      detail.value = res.data
    }
    catch (err: unknown) {
      detail.value = null
      if (getApiErrorStatus(err) === 404) notFound.value = true
      else error.value = getApiErrorMessage(err, 'No se pudo cargar el cierre')
    }
    finally {
      isLoading.value = false
      hasFetched.value = true
    }
  }

  /** Cierra o regenera el periodo con los datos de este momento. Lanza el error para el toast. */
  async function closePeriod(period: string): Promise<MembershipClosingDetail> {
    isClosing.value = true
    try {
      const res = await $fetch<{ data: MembershipClosingDetail }>(
        `/api/admin/membership/closings/${encodeURIComponent(period)}/close`,
        { method: 'POST' },
      )
      return res.data
    }
    catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'No se pudo cerrar el mes'))
    }
    finally {
      isClosing.value = false
    }
  }

  return {
    closings: readonly(closings),
    detail: readonly(detail),
    isLoading: readonly(isLoading),
    hasFetched: readonly(hasFetched),
    isClosing: readonly(isClosing),
    error: readonly(error),
    notFound: readonly(notFound),
    fetchClosings,
    fetchDetail,
    closePeriod,
  }
}

/** Historial de tarifas y alta de una nueva (solo superadmin). */
export function useMembershipRates() {
  const rates = ref<MembershipRate[]>([])
  const isLoading = ref(false)
  const hasFetched = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  async function fetchRates() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: MembershipRate[] }>('/api/admin/membership/rates')
      rates.value = res.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'No se pudo cargar el historial de tarifas')
    }
    finally {
      isLoading.value = false
      hasFetched.value = true
    }
  }

  /** Guarda la tarifa. Lanza el error con el mensaje del servidor para mostrarlo en el formulario. */
  async function createRate(input: MembershipRateInput): Promise<MembershipRate> {
    isSaving.value = true
    try {
      const res = await $fetch<{ data: MembershipRate }>('/api/admin/membership/rates', { method: 'POST', body: input })
      await fetchRates()
      return res.data
    }
    catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'No se pudo guardar la tarifa'))
    }
    finally {
      isSaving.value = false
    }
  }

  return {
    rates: readonly(rates),
    isLoading: readonly(isLoading),
    hasFetched: readonly(hasFetched),
    isSaving: readonly(isSaving),
    error: readonly(error),
    fetchRates,
    createRate,
  }
}
