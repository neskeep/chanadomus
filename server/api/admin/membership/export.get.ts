import { z } from 'zod'
import { localTodayString } from '~~/server/utils/tenant-time'
import { membershipPeriodSchema, summarize } from '~~/shared/lib/membership'
import { MEMBERSHIP_TIER_LABELS, MEMBERSHIP_UNIT_KIND_LABELS } from '~~/shared/types/membership'

const querySchema = z.object({ period: membershipPeriodSchema.optional() })

/**
 * GET /api/admin/membership/export?period=YYYY-MM
 * - Con `period`: CSV de la foto guardada de ese cierre (404 si no existe).
 * - Sin `period`: CSV del cálculo en vivo del mes en curso, con columnas de contexto.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  const { period } = parseOrThrow(querySchema, getQuery(event))

  const status = (isActive: boolean) => (isActive ? 'Activa' : 'Inactiva')

  if (period) {
    const detail = await getMembershipClosingDetail(tenantId, period)
    if (!detail) throw createError({ statusCode: 404, message: 'Ese mes todavía no tiene cierre' })

    const csv = buildCsv(
      ['Periodo', 'Unidad', 'Nombre', 'Tipo', 'Estado', 'Tarifa', 'Importe', 'Moneda', 'Motivo'],
      [
        ...detail.units.map(unit => [
          period,
          unit.unitNumber,
          unit.unitLabel,
          MEMBERSHIP_UNIT_KIND_LABELS[unit.unitKind],
          status(unit.isActive),
          MEMBERSHIP_TIER_LABELS[unit.tier],
          unit.rate.toFixed(2),
          detail.closing.currency,
          unit.reasons,
        ]),
        [period, 'TOTAL', null, null, null, null, detail.closing.total.toFixed(2), detail.closing.currency, null],
      ],
    )
    return sendCsv(event, `membresia-${period}`, csv)
  }

  const now = new Date()
  const current = currentMembershipPeriod(now)
  const { rate } = liveRate(await listMembershipRates(tenantId), localTodayString(now))
  const { units } = await computeMembershipUnits(tenantId, rate, { now })
  const currency = rate?.currency ?? ''
  const { total } = summarize(units, rate)

  const csv = buildCsv(
    ['Periodo', 'Unidad', 'Nombre', 'Tipo', 'Estado', 'Tarifa', 'Importe', 'Moneda', 'Motivo', 'Accesos 30 días', 'Movimientos', 'Saldo'],
    [
      ...units.map(unit => [
        current,
        unit.number,
        unit.label,
        MEMBERSHIP_UNIT_KIND_LABELS[unit.kind],
        status(unit.isActive),
        MEMBERSHIP_TIER_LABELS[unit.tier],
        unit.rate?.toFixed(2),
        currency,
        unit.reasons,
        unit.accesses30d,
        unit.financialMovements,
        unit.balance.toFixed(2),
      ]),
      [current, 'TOTAL', null, null, null, null, total?.toFixed(2), currency, null, null, null, null],
    ],
  )
  return sendCsv(event, `membresia-${current}-en-curso`, csv)
})
