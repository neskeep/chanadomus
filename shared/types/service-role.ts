// Catálogo de roles de servicio (tabla service_staff_roles).
// Se usa como categoría de proveedores y como rol del personal.

export type ServiceRoleAppliesTo = 'staff' | 'provider'

export interface ServiceRole {
  id: string
  name: string
  description: string | null
  appliesToStaff: boolean
  appliesToProviders: boolean
  isActive: boolean
  displayOrder: number
  tenantId: string
  createdAt: string
}

/** Subconjunto que usan los formularios de admin (combobox con alta inline). */
export type ServiceRoleSummary = Pick<ServiceRole, 'id' | 'name' | 'description' | 'isActive' | 'displayOrder'>

/** Categoría de proveedor expuesta a cualquier usuario autenticado del tenant. */
export type ProviderCategoryOption = Pick<ServiceRole, 'id' | 'name' | 'displayOrder'>
