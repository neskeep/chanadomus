import { localTodayString } from '~~/server/utils/tenant-time'
import { hasMorePages, pageOffset } from '~~/shared/lib/pagination'
import { filterMembershipUnits, membershipUnitsQuerySchema } from '~~/shared/lib/membership'
import type { Paginated } from '~~/shared/types/pagination'
import type { MembershipUnit } from '~~/shared/types/membership'

/**
 * GET /api/admin/membership/units?tier=full&kind=parcela&active=true&search=&page=1&limit=25
 * Unidades cobrables con su tarifa en vivo, motivo y contexto de uso.
 * El cálculo cubre todas las unidades del tenant (decenas), así que filtra y pagina en memoria.
 */
export default defineEventHandler(async (event): Promise<Paginated<MembershipUnit>> => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  const { tier, kind, active, search, page, limit } = validateQuery(event, membershipUnitsQuerySchema)

  const now = new Date()
  const { rate } = liveRate(await listMembershipRates(tenantId), localTodayString(now))
  const { units } = await computeMembershipUnits(tenantId, rate, { now })

  const filtered = filterMembershipUnits(units, { tier, kind, active, search })
  const offset = pageOffset(page, limit)
  const total = filtered.length

  return {
    data: filtered.slice(offset, offset + limit),
    meta: { total, page, limit, hasMore: hasMorePages(page, limit, total) },
  }
})
