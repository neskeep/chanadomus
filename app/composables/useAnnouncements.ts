import type { Announcement, AnnouncementCategory, AnnouncementStatus } from '~~/shared/types/announcement'

interface AnnouncementsMeta {
  total: number
  page: number
  limit: number
}

interface FetchAnnouncementsParams {
  page?: number
  limit?: number
  category?: AnnouncementCategory
  status?: AnnouncementStatus
}

export function useAnnouncements() {
  const announcements = ref<Announcement[]>([])
  const meta = ref<AnnouncementsMeta>({ total: 0, page: 1, limit: 20 })
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchAnnouncements(params: FetchAnnouncementsParams = {}) {
    isLoading.value = true
    error.value = null
    try {
      const query: Record<string, string | number> = {}
      if (params.page) query.page = params.page
      if (params.limit) query.limit = params.limit
      if (params.category) query.category = params.category
      if (params.status) query.status = params.status

      const res = await $fetch<{ data: Announcement[]; meta: AnnouncementsMeta }>(
        '/api/announcements',
        { params: query },
      )
      announcements.value = res.data
      meta.value = res.meta
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar anuncios'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchAnnouncement(id: string): Promise<Announcement> {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Announcement }>(`/api/announcements/${id}`)
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar anuncio'
      error.value = message
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  async function createAnnouncement(formData: FormData): Promise<Announcement> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Announcement }>('/api/announcements', {
        method: 'POST',
        body: formData,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear anuncio'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function updateAnnouncement(id: string, data: Partial<Pick<Announcement, 'title' | 'body' | 'category' | 'status' | 'expiresAt'>>): Promise<Announcement> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Announcement }>(`/api/announcements/${id}`, {
        method: 'PATCH',
        body: data,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar anuncio'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function publishAnnouncement(id: string): Promise<Announcement> {
    return updateAnnouncement(id, { status: 'published' })
  }

  async function archiveAnnouncement(id: string): Promise<Announcement> {
    return updateAnnouncement(id, { status: 'archived' })
  }

  async function deleteAnnouncement(id: string): Promise<void> {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      })
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar anuncio'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  const totalPages = computed(() => Math.ceil(meta.value.total / meta.value.limit) || 1)

  return {
    announcements,
    meta,
    isLoading,
    isSubmitting,
    error,
    totalPages,
    fetchAnnouncements,
    fetchAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    publishAnnouncement,
    archiveAnnouncement,
    deleteAnnouncement,
  }
}
