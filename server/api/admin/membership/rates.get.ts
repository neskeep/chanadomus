import type { MembershipRate } from '~~/shared/types/membership'

/**
 * GET /api/admin/membership/rates
 * Historial de tarifas, de la más reciente a la más antigua.
 */
export default defineEventHandler(async (event): Promise<{ data: MembershipRate[] }> => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  return { data: await listMembershipRates(tenantId) }
})
