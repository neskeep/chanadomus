import type { Vehicle } from '~~/shared/types/vehicle'

interface CreateVehicleData {
  plate: string
  brand: string
  model: string
  color: string
  ownerMemberId?: string
}

type UpdateVehicleData = Partial<CreateVehicleData>

export function useUnitVehicles(unitId: Ref<string> | string) {
  const vehicles = ref<Vehicle[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchVehicles() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Vehicle[] }>(
        `/api/units/${unref(unitId)}/vehicles`,
      )
      vehicles.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar vehículos'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function createVehicle(data: CreateVehicleData) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Vehicle }>(
        `/api/units/${unref(unitId)}/vehicles`,
        {
          method: 'POST',
          body: data,
        },
      )
      await fetchVehicles()
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar vehículo'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function updateVehicle(vehicleId: string, data: UpdateVehicleData) {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: Vehicle }>(
        `/api/vehicles/${vehicleId}`,
        {
          method: 'PATCH',
          body: data,
        },
      )
      await fetchVehicles()
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar vehículo'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function deleteVehicle(vehicleId: string) {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
      })
      await fetchVehicles()
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar vehículo'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    vehicles,
    isLoading,
    isSubmitting,
    error,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
  }
}
