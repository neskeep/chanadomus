import type { GenerateQrInput, QrPassItem, QrStatusFilter, UpdateQrInput } from '~~/shared/types/qr'
import type { PaginationMeta, Paginated } from '~~/shared/types/pagination'
import { QR_LIST_DEFAULT_LIMIT } from '~~/shared/lib/qr-pass'

interface Unit {
  id: string
  number: string
  label: string | null
}

function emptyMeta(limit = QR_LIST_DEFAULT_LIMIT): PaginationMeta {
  return { total: 0, page: 1, limit, hasMore: false }
}

/**
 * Pases de visita de la unidad del usuario.
 * - fetchMyCodes(status): primera página del filtro (reemplaza la lista)
 * - loadMoreCodes(): añade la siguiente página ("cargar más")
 * - fetchQrPass(id) / updateQr(id, input) / cancelQr(id): un pase
 * Cada pase trae `canEdit` y `canCancel` calculados en el servidor.
 */
export function useQr() {
  const myCodes = ref<QrPassItem[]>([])
  const meta = ref<PaginationMeta>(emptyMeta())
  const units = ref<Unit[]>([])
  const isGenerating = ref(false)
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const isCanceling = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const currentFilter = ref<QrStatusFilter>('all')

  const hasMoreCodes = computed(() => meta.value.hasMore)

  // Evita que una respuesta tardía de un filtro anterior pise la lista actual
  let listRequestId = 0

  async function generateQr(input: GenerateQrInput) {
    isGenerating.value = true
    error.value = null

    try {
      const result = await $fetch('/api/qr/generate', {
        method: 'POST',
        body: input,
      })
      return result.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al generar el código QR')
      throw err
    }
    finally {
      isGenerating.value = false
    }
  }

  async function requestPage(status: QrStatusFilter, page: number, limit: number) {
    return $fetch<Paginated<QrPassItem>>('/api/qr/my-codes', {
      query: { status, page, limit },
    })
  }

  async function fetchMyCodes(status: QrStatusFilter = 'all', limit = QR_LIST_DEFAULT_LIMIT) {
    const requestId = ++listRequestId
    isLoading.value = true
    error.value = null
    currentFilter.value = status

    try {
      const result = await requestPage(status, 1, limit)
      if (requestId !== listRequestId) return
      myCodes.value = result.data
      meta.value = result.meta
    }
    catch (err: unknown) {
      if (requestId !== listRequestId) return
      error.value = getApiErrorMessage(err, 'Error al cargar las visitas')
    }
    finally {
      if (requestId === listRequestId) isLoading.value = false
    }
  }

  async function loadMoreCodes() {
    if (!meta.value.hasMore || isLoading.value || isLoadingMore.value) return
    const requestId = listRequestId
    isLoadingMore.value = true
    error.value = null

    try {
      const result = await requestPage(currentFilter.value, meta.value.page + 1, meta.value.limit)
      if (requestId !== listRequestId) return
      // Si algo cambió entre páginas (p. ej. un pase venció) puede repetirse un id
      const seen = new Set(myCodes.value.map(c => c.id))
      myCodes.value = [...myCodes.value, ...result.data.filter(c => !seen.has(c.id))]
      meta.value = result.meta
    }
    catch (err: unknown) {
      if (requestId !== listRequestId) return
      error.value = getApiErrorMessage(err, 'Error al cargar más visitas')
    }
    finally {
      isLoadingMore.value = false
    }
  }

  /** Aplica a la lista cargada un pase actualizado por el servidor. */
  function applyToList(item: QrPassItem) {
    const index = myCodes.value.findIndex(c => c.id === item.id)
    if (index === -1) return
    const stillMatches = currentFilter.value === 'all' || currentFilter.value === item.status
    if (stillMatches) {
      myCodes.value.splice(index, 1, item)
    }
    else {
      myCodes.value.splice(index, 1)
      meta.value = { ...meta.value, total: Math.max(0, meta.value.total - 1) }
    }
  }

  async function fetchQrPass(id: string): Promise<QrPassItem> {
    error.value = null
    try {
      const result = await $fetch<{ data: QrPassItem }>(`/api/qr/${id}`)
      return result.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al cargar el pase')
      throw err
    }
  }

  async function updateQr(id: string, input: UpdateQrInput): Promise<QrPassItem> {
    isSaving.value = true
    error.value = null
    try {
      const result = await $fetch<{ data: QrPassItem }>(`/api/qr/${id}`, {
        method: 'PATCH',
        body: input,
      })
      applyToList(result.data)
      return result.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al guardar el pase')
      throw err
    }
    finally {
      isSaving.value = false
    }
  }

  async function cancelQr(id: string): Promise<QrPassItem> {
    isCanceling.value = true
    error.value = null

    try {
      const result = await $fetch<{ data: QrPassItem }>(`/api/qr/${id}/cancel`, {
        method: 'POST',
      })
      applyToList(result.data)
      return result.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al cancelar el pase')
      throw err
    }
    finally {
      isCanceling.value = false
    }
  }

  async function fetchUnits() {
    try {
      const result = await $fetch('/api/units')
      units.value = result.data
    }
    catch (err: unknown) {
      error.value = getApiErrorMessage(err, 'Error al cargar las unidades')
    }
  }

  return {
    myCodes,
    meta,
    hasMoreCodes,
    units,
    isGenerating,
    isLoading,
    isLoadingMore,
    isCanceling,
    isSaving,
    error,
    currentFilter,
    generateQr,
    fetchMyCodes,
    loadMoreCodes,
    fetchQrPass,
    updateQr,
    cancelQr,
    fetchUnits,
  }
}
