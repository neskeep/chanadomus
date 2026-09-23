import type { ServiceRoleAppliesTo } from '~~/shared/types/service-role'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const query = getQuery(event)
  const includeInactive = query.includeInactive === 'true'
  const appliesTo = query.appliesTo === 'staff' || query.appliesTo === 'provider'
    ? query.appliesTo as ServiceRoleAppliesTo
    : undefined

  const rows = await listServiceRoles(tenantId, { appliesTo, includeInactive })

  return { data: rows }
})
