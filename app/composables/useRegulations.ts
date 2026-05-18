import type { Regulation, RegulationCategory } from '~~/shared/types/regulation'

interface FetchRegulationsParams {
  category?: RegulationCategory
}

export function useRegulations() {
  const regulations = ref<Regulation[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchRegulations(params: FetchRegulationsParams = {}) {
    isLoading.value = true
    error.value = null
    try {
      const query: Record<string, string> = {}
      if (params.category) query.category = params.category

      const res = await $fetch<{ data: Regulation[] }>(
        '/api/regulations',
        { params: query },
      )
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

  /** Group regulations by category */
  const grouped = computed(() => {
    const groups: Record<RegulationCategory, Regulation[]> = {
      normas: [],
      horarios: [],
      arquitectura: [],
    }
    for (const reg of regulations.value) {
      groups[reg.category].push(reg)
    }
    return groups
  })

  return {
    regulations,
    grouped,
    isLoading,
    isSubmitting,
    error,
    fetchRegulations,
    createRegulation,
    deleteRegulation,
  }
}
