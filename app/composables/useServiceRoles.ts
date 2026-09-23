import type { ServiceRoleSummary, ProviderCategoryOption } from '~~/shared/types/service-role'

/**
 * Roles de servicio que aplican a proveedores, con alta inline.
 * Solo admin: usa /api/admin/service-roles.
 */
export function useServiceRoles() {
  const roles = ref<ServiceRoleSummary[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRoles() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: ServiceRoleSummary[] }>('/api/admin/service-roles', {
        params: { appliesTo: 'provider' },
      })
      roles.value = res.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al cargar roles de servicio'
    } finally {
      isLoading.value = false
    }
  }

  async function createRole(name: string): Promise<ServiceRoleSummary> {
    error.value = null
    try {
      const res = await $fetch<{ data: ServiceRoleSummary }>('/api/admin/service-roles', {
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

/**
 * Categorías de proveedores (roles de servicio activos que aplican a proveedores).
 * Solo lectura, para cualquier rol autenticado: usa /api/providers/categories.
 */
export function useProviderCategories() {
  const categories = ref<ProviderCategoryOption[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const categoryOptions = computed(() =>
    categories.value.map(c => ({ value: c.id, label: c.name })),
  )

  async function fetchCategories() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: ProviderCategoryOption[] }>('/api/providers/categories')
      categories.value = res.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al cargar categorías'
    } finally {
      isLoading.value = false
    }
  }

  return { categories, categoryOptions, isLoading, error, fetchCategories }
}
