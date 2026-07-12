import type { ChangelogEntry, ChangelogItem } from '~~/shared/types/changelog'

interface ChangelogMeta {
  total: number
  page: number
  limit: number
}

interface FetchChangelogParams {
  page?: number
  limit?: number
}

interface CreateChangelogPayload {
  version: string
  title: string
  changes: ChangelogItem[]
  publishedAt: string
}

interface UpdateChangelogPayload {
  version?: string
  title?: string
  changes?: ChangelogItem[]
  publishedAt?: string
}

export function useChangelog() {
  const entries = ref<ChangelogEntry[]>([])
  const entry = ref<ChangelogEntry | null>(null)
  const meta = ref<ChangelogMeta>({ total: 0, page: 1, limit: 20 })
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isDeleting = ref(false)
  const error = ref<string | null>(null)

  async function fetchEntries(params: FetchChangelogParams = {}) {
    isLoading.value = true
    error.value = null
    try {
      const query: Record<string, number> = {}
      if (params.page) query.page = params.page
      if (params.limit) query.limit = params.limit

      const res = await $fetch<{ data: ChangelogEntry[], meta: ChangelogMeta }>(
        '/api/changelog',
        { params: query },
      )
      entries.value = res.data
      meta.value = res.meta
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar changelog'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchEntry(id: string) {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: ChangelogEntry }>(`/api/changelog/${id}`)
      entry.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar entrada'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function createEntry(payload: CreateChangelogPayload) {
    isSaving.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: ChangelogEntry }>('/api/changelog', {
        method: 'POST',
        body: payload,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear entrada'
      error.value = message
      throw err
    }
    finally {
      isSaving.value = false
    }
  }

  async function updateEntry(id: string, payload: UpdateChangelogPayload) {
    isSaving.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: ChangelogEntry }>(`/api/changelog/${id}`, {
        method: 'PUT',
        body: payload,
      })
      entry.value = res.data
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar entrada'
      error.value = message
      throw err
    }
    finally {
      isSaving.value = false
    }
  }

  async function deleteEntry(id: string) {
    isDeleting.value = true
    error.value = null
    try {
      await $fetch(`/api/changelog/${id}`, { method: 'DELETE' })
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar entrada'
      error.value = message
      throw err
    }
    finally {
      isDeleting.value = false
    }
  }

  const totalPages = computed(() => Math.ceil(meta.value.total / meta.value.limit) || 1)

  return {
    entries,
    entry,
    meta,
    isLoading,
    isSaving,
    isDeleting,
    error,
    totalPages,
    fetchEntries,
    fetchEntry,
    createEntry,
    updateEntry,
    deleteEntry,
  }
}
