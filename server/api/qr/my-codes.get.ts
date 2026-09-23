import { z } from 'zod'
import { and, count, eq } from 'drizzle-orm'
import { db } from '~~/server/db'
import { qrCodes } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import { hasMorePages, pageOffset, paginationQuerySchema } from '~~/shared/lib/pagination'
import { QR_LIST_DEFAULT_LIMIT, QR_LIST_MAX_LIMIT } from '~~/shared/lib/qr-pass'
import type { QrPassItem } from '~~/shared/types/qr'
import type { Paginated } from '~~/shared/types/pagination'

const querySchema = paginationQuerySchema(QR_LIST_DEFAULT_LIMIT, QR_LIST_MAX_LIMIT).extend({
  status: z.enum(['all', 'active', 'used', 'expired', 'canceled'], {
    error: 'status debe ser "all", "active", "used", "expired" o "canceled"',
  }).default('all'),
})

/**
 * GET /api/qr/my-codes?status=active&page=1&limit=20
 * Pases de la unidad del usuario (propietario: su unidad; conserje: la que
 * gestiona). Filtro de estado, orden y paginación en SQL. Semántica de los
 * estados en shared/lib/qr-pass.ts; orden por estado en qrStatusOrder().
 */
export default defineEventHandler(async (event): Promise<Paginated<QrPassItem>> => {
  const { tenantId, user } = await requireTenant(event)
  const session = await requireRole(event, ['propietario', 'admin', 'conserje'])
  const { status, page, limit } = parseOrThrow(querySchema, getQuery(event))

  const userUnitId = await getUnitIdForPass(user.id, tenantId, session.user.role as string)
  if (!userUnitId) {
    throw createError({ statusCode: 400, message: 'Usuario sin unidad asignada' })
  }

  const now = new Date()
  const tz = getAppTimezone()
  const where = and(
    eq(qrCodes.tenantId, tenantId),
    eq(qrCodes.unitId, userUnitId),
    qrStatusCondition(status, now),
  )

  const [rows, totals] = await Promise.all([
    db
      .select(qrPassColumns)
      .from(qrCodes)
      .innerJoin(units, eq(units.id, qrCodes.unitId))
      .where(where)
      .orderBy(...qrStatusOrder(status, now, tz))
      .limit(limit)
      .offset(pageOffset(page, limit)),
    db.select({ total: count() }).from(qrCodes).where(where),
  ])

  const total = totals[0]?.total ?? 0
  return {
    data: rows.map(row => toQrPassItem(row, now, tz)),
    meta: { total, page, limit, hasMore: hasMorePages(page, limit, total) },
  }
})
