import type { Vehicle } from '~~/shared/types/vehicle'

interface VehicleSearchResult extends Vehicle {
  unitNumber: string
  unitLabel: string | null
}

export function useVehicleSearch() {
  const results = ref<VehicleSearchResult[]>([])
  const isLoading = ref(false)
  const query = ref('')
  const error = ref<string | null>(null)

  async function searchByPlate(plate: string) {
    isLoading.value = true
    error.value = null
    query.value = plate
    try {
      const res = await $fetch<{ data: VehicleSearchResult[] }>(
        '/api/vehicles',
        { params: { plate } },
      )
      results.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al buscar vehículo'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  function clearSearch() {
    results.value = []
    query.value = ''
    error.value = null
  }

  return {
    results,
    isLoading,
    query,
    error,
    searchByPlate,
    clearSearch,
  }
}
