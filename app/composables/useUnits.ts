export function useUnits() {
  const units = ref<Array<{ id: string; number: string; label: string | null }>>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchUnits() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Array<{ id: string; number: string; label: string | null }> }>('/api/units')
      units.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar unidades'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  return { units, isLoading, error, fetchUnits }
}
