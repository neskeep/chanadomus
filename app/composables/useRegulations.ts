import type { Regulation } from '~~/shared/types/regulation'

export function useRegulations() {
  const regulations = ref<Regulation[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchRegulations() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Regulation[] }>('/api/regulations')
      regulations.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar normativas'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function createRegulation(formData: FormData): Promise<Regulation> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Regulation }>('/api/regulations', {
        method: 'POST',
        body: formData,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al subir normativa'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function fetchRegulation(id: string): Promise<Regulation | null> {
    try {
      const res = await $fetch<{ data: Regulation[] }>('/api/regulations')
      return res.data.find(r => r.id === id) ?? null
    } catch {
      return null
    }
  }

  async function updateRegulation(id: string, formData: FormData): Promise<Regulation> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Regulation }>(`/api/regulations/${id}`, {
        method: 'PATCH',
        body: formData,
      })
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar normativa'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function deleteRegulation(id: string): Promise<void> {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/regulations/${id}`, {
        method: 'DELETE',
      })
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar normativa'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    regulations,
    isLoading,
    isSubmitting,
    error,
    fetchRegulations,
    fetchRegulation,
    createRegulation,
    updateRegulation,
    deleteRegulation,
  }
}
