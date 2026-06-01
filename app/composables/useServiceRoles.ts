interface ServiceRole {
  id: string
  name: string
  description: string | null
  isActive: boolean
  displayOrder: number
}

export function useServiceRoles() {
  const roles = ref<ServiceRole[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRoles() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: ServiceRole[] }>('/api/admin/service-roles', {
        params: { appliesTo: 'provider' },
      })
      roles.value = res.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al cargar roles de servicio'
    } finally {
      isLoading.value = false
    }
  }

  async function createRole(name: string): Promise<ServiceRole> {
    error.value = null
    try {
      const res = await $fetch<{ data: ServiceRole }>('/api/admin/service-roles', {
        method: 'POST',
        body: { name: name.trim(), appliesToStaff: false, appliesToProviders: true },
      })
      // Add to local list
      roles.value.push(res.data)
      return res.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al crear rol de servicio'
      throw err
    }
  }

  return { roles, isLoading, error, fetchRoles, createRole }
}
