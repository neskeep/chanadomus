import type { ProviderCategoryOption } from '~~/shared/types/service-role'

// Categorías de proveedores (roles de servicio activos que aplican a proveedores).
// Solo lectura, disponible para cualquier usuario autenticado del tenant.
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenant(event)

  const rows = await listServiceRoles(tenantId, { appliesTo: 'provider' })
  const data: ProviderCategoryOption[] = rows.map(r => ({
    id: r.id,
    name: r.name,
    displayOrder: r.displayOrder,
  }))

  return { data }
})
