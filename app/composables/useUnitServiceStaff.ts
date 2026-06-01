import type { UnitServiceStaff, ServiceStaffPass } from '~~/shared/types/unit-service-staff'

export function useUnitServiceStaff(unitId: Ref<string> | string) {
  const serviceStaff = ref<UnitServiceStaff[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchServiceStaff() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: UnitServiceStaff[] }>(
        `/api/units/${unref(unitId)}/service-staff`,
      )
      serviceStaff.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar personal'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function generateStaffPass(staffId: string): Promise<ServiceStaffPass> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: ServiceStaffPass }>(
        `/api/units/${unref(unitId)}/service-staff/${staffId}/pass`,
        { method: 'POST' },
      )
      await fetchServiceStaff()
      return res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al generar pase'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    serviceStaff,
    isLoading,
    isSubmitting,
    error,
    fetchServiceStaff,
    generateStaffPass,
  }
}
