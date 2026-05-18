interface ConserjeUnit {
  unitId: string
  unitNumber: string
  unitLabel: string | null
}

export function useConserjeUnit() {
  const unit = ref<ConserjeUnit | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const unitId = computed(() => unit.value?.unitId ?? null)

  async function fetchUnit() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: ConserjeUnit }>('/api/staff/my-unit')
      unit.value = res.data
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al obtener unidad asignada'
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    unit,
    unitId,
    isLoading,
    error,
    fetchUnit,
  }
}
