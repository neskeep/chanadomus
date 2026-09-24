import { membershipPeriodSchema } from '~~/shared/lib/membership'
import type { MembershipClosingDetail } from '~~/shared/types/membership'

/**
 * GET /api/admin/membership/closings/:period  (period = YYYY-MM)
 * Detalle de un cierre con la instantánea de cada unidad.
 */
export default defineEventHandler(async (event): Promise<{ data: MembershipClosingDetail }> => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  const period = parseOrThrow(membershipPeriodSchema, getRouterParam(event, 'period'))

  const detail = await getMembershipClosingDetail(tenantId, period)
  if (!detail) throw createError({ statusCode: 404, message: 'Ese mes todavía no tiene cierre' })
  return { data: detail }
})
