import type {
  Provider,
  ProviderCategory,
  ProviderReview,
  CreateProvider,
  UpdateProvider,
  CreateReview,
} from '~~/shared/types/provider'

interface ProvidersMeta {
  total: number
  page: number
  limit: number
}

interface FetchProvidersParams {
  page?: number
  limit?: number
  category?: ProviderCategory
  search?: string
  status?: Provider['status']
}

interface SuggestProviderPayload {
  name: string
  category: ProviderCategory
  phone?: string
  notes?: string
}

export function useProviders() {
  const providers = ref<Provider[]>([])
  const meta = ref<ProvidersMeta>({ total: 0, page: 1, limit: 20 })
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchProviders(params: FetchProvidersParams = {}) {
    isLoading.value = true
    error.value = null
    try {
      const query: Record<string, string | number> = {}
      if (params.page) query.page = params.page
      if (params.limit) query.limit = params.limit
      if (params.category) query.category = params.category
      if (params.search) query.search = params.search
      if (params.status) query.status = params.status

      const res = await $fetch<{ data: Provider[]; meta: ProvidersMeta }>(
        '/api/providers',
        { params: query },
      )
      providers.value = res.data
      meta.value = res.meta
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar proveedores'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchProvider(id: string): Promise<Provider> {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Provider }>(`/api/providers/${id}`)
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar proveedor'
      error.value = message
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function createProvider(data: CreateProvider): Promise<Provider> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Provider }>('/api/providers', {
        method: 'POST',
        body: data,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear proveedor'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function updateProvider(id: string, data: UpdateProvider): Promise<Provider> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Provider }>(`/api/providers/${id}`, {
        method: 'PATCH',
        body: data,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar proveedor'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function deleteProvider(id: string): Promise<void> {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/providers/${id}`, {
        method: 'DELETE',
      })
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar proveedor'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function submitReview(providerId: string, data: CreateReview): Promise<ProviderReview> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: ProviderReview }>(`/api/providers/${providerId}/reviews`, {
        method: 'POST',
        body: data,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al enviar resena'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function suggestProvider(data: SuggestProviderPayload): Promise<Provider> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Provider }>('/api/providers/suggestions', {
        method: 'POST',
        body: data,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al sugerir proveedor'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  const totalPages = computed(() => Math.ceil(meta.value.total / meta.value.limit) || 1)

  return {
    providers,
    meta,
    isLoading,
    isSubmitting,
    error,
    totalPages,
    fetchProviders,
    fetchProvider,
    createProvider,
    updateProvider,
    deleteProvider,
    submitReview,
    suggestProvider,
  }
}
