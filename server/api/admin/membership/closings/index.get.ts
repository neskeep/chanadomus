import type { MembershipClosing } from '~~/shared/types/membership'

/**
 * GET /api/admin/membership/closings
 * Cierres mensuales del tenant, del más reciente al más antiguo.
 */
export default defineEventHandler(async (event): Promise<{ data: MembershipClosing[] }> => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  await ensureMonthlyClosings(tenantId)
  return { data: await listMembershipClosings(tenantId) }
})
