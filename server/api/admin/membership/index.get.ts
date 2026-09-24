import { localTodayString } from '~~/server/utils/tenant-time'
import { summarize } from '~~/shared/lib/membership'
import type { MembershipSummary } from '~~/shared/types/membership'

/**
 * GET /api/admin/membership
 * Resumen en vivo del cobro del mes en curso: totales por tarifa, por tipo y
 * tipo×tarifa, total mensual y tarifa aplicada. Antes genera, si falta, el
 * cierre automático del mes anterior (ensureMonthlyClosings).
 */
export default defineEventHandler(async (event): Promise<{ data: MembershipSummary }> => {
  const session = await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  const isSuperAdmin = (session.user as Record<string, unknown>).isSuperAdmin === true

  await ensureMonthlyClosings(tenantId)

  const now = new Date()
  const [rates, lastClosings] = await Promise.all([
    listMembershipRates(tenantId),
    listMembershipClosings(tenantId, 1),
  ])
  const { rate, status } = liveRate(rates, localTodayString(now))
  const { units, excludedDemoUnits } = await computeMembershipUnits(tenantId, rate, { now })

  return {
    data: {
      period: currentMembershipPeriod(now),
      rate,
      rateStatus: status,
      totals: summarize(units, rate),
      excludedDemoUnits,
      lastClosing: lastClosings[0] ?? null,
      isSuperAdmin,
    },
  }
})
