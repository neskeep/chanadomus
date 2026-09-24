import { membershipPeriodSchema } from '~~/shared/lib/membership'
import type { MembershipClosingDetail } from '~~/shared/types/membership'

/**
 * POST /api/admin/membership/closings/:period/close  (solo superadmin)
 * Cierra o regenera el mes con los datos de este momento. Reemplaza la foto
 * anterior del periodo y registra quién lo hizo. No admite meses futuros.
 */
export default defineEventHandler(async (event): Promise<{ data: MembershipClosingDetail }> => {
  await requireRole(event, ['admin'])
  const session = await requireSuperAdmin(event)
  const period = parseOrThrow(membershipPeriodSchema, getRouterParam(event, 'period'))

  if (period > currentMembershipPeriod()) {
    throw createError({ statusCode: 400, message: 'No puedes cerrar un mes que todavía no ha empezado' })
  }

  return { data: await closeMembershipPeriod(session.tenantId, period, session.user.id) }
})
