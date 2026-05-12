import type {
  FrequentVisitor,
  CreateFrequentVisitor,
  UpdateFrequentVisitor,
} from '~~/shared/types/frequent-visitor'

export function useFrequentVisitors() {
  const visitors = ref<FrequentVisitor[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchVisitors() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: FrequentVisitor[] }>('/api/frequent-visitors')
      visitors.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar visitantes frecuentes'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function addVisitor(data: CreateFrequentVisitor): Promise<FrequentVisitor> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: FrequentVisitor }>('/api/frequent-visitors', {
        method: 'POST',
        body: data,
      })
      visitors.value.unshift(res.data)
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear visitante frecuente'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function updateVisitor(id: string, data: UpdateFrequentVisitor): Promise<FrequentVisitor> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: FrequentVisitor }>(`/api/frequent-visitors/${id}`, {
        method: 'PATCH',
        body: data,
      })
      const idx = visitors.value.findIndex((v) => v.id === id)
      if (idx !== -1) {
        visitors.value[idx] = res.data
      }
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar visitante frecuente'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function removeVisitor(id: string): Promise<void> {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/frequent-visitors/${id}`, {
        method: 'DELETE',
      })
      visitors.value = visitors.value.filter((v) => v.id !== id)
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar visitante frecuente'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    visitors,
    isLoading,
    isSubmitting,
    error,
    fetchVisitors,
    addVisitor,
    updateVisitor,
    removeVisitor,
  }
}
