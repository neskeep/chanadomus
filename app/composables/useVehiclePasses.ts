import type { VehiclePass, CreateVehiclePassInput, UpdateVehiclePassInput, VehiclePassType } from '~~/shared/types/vehicle-pass'

interface VehiclePassFilters {
  vehicleId?: string
  passType?: VehiclePassType
  isActive?: boolean
}

export function useVehiclePasses() {
  const passes = ref<VehiclePass[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPasses(filters?: VehiclePassFilters) {
    isLoading.value = true
    error.value = null
    try {
      const params: Record<string, string> = {}
      if (filters?.vehicleId) params.vehicleId = filters.vehicleId
      if (filters?.passType) params.passType = filters.passType
      if (filters?.isActive !== undefined) params.isActive = String(filters.isActive)

      const res = await $fetch<{ data: VehiclePass[] }>('/api/vehicle-passes', { params })
      passes.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar pases vehiculares'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function createPass(data: CreateVehiclePassInput): Promise<VehiclePass | null> {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: VehiclePass }>('/api/vehicle-passes', {
        method: 'POST',
        body: data,
      })
      passes.value.unshift(res.data)
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear pase vehicular'
      error.value = message
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  async function updatePass(id: string, data: UpdateVehiclePassInput): Promise<VehiclePass | null> {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: VehiclePass }>(`/api/vehicle-passes/${id}`, {
        method: 'PATCH',
        body: data,
      })
      const idx = passes.value.findIndex(p => p.id === id)
      if (idx !== -1) passes.value[idx] = res.data
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar pase vehicular'
      error.value = message
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  async function deactivatePass(id: string): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      await $fetch(`/api/vehicle-passes/${id}/deactivate`, { method: 'POST' })
      const idx = passes.value.findIndex(p => p.id === id)
      if (idx !== -1) {
        const existing = passes.value[idx]!
        passes.value[idx] = {
          ...existing,
          isActive: false,
          deactivatedAt: new Date().toISOString(),
        }
      }
      return true
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al desactivar pase vehicular'
      error.value = message
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  async function deletePass(id: string): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      await $fetch(`/api/vehicle-passes/${id}`, { method: 'DELETE' })
      passes.value = passes.value.filter(p => p.id !== id)
      return true
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar pase vehicular'
      error.value = message
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    passes: readonly(passes),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchPasses,
    createPass,
    updatePass,
    deactivatePass,
    deletePass,
  }
}
