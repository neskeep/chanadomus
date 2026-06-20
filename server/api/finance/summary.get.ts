import { db } from '~~/server/db'
import { units } from '~~/server/db/schema/unit'
import { financialRecords } from '~~/server/db/schema/financial'
import { eq, sql, asc, and, gte, lte } from 'drizzle-orm'
import type { UnitSummary } from '~~/shared/types/financial'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const query = getQuery(event)
  const from = typeof query.from === 'string' ? query.from : undefined
  const to = typeof query.to === 'string' ? query.to : undefined

  // Build JOIN condition: always match unit + tenant, optionally filter by date range
  const dateConditions: ReturnType<typeof sql>[] = [
    sql`${units.id} = ${financialRecords.unitId} AND ${financialRecords.tenantId} = ${units.tenantId}`,
  ]
  if (from) {
    dateConditions.push(sql`${financialRecords.date} >= ${parseFilterFrom(from)}`)
  }
  if (to) {
    dateConditions.push(sql`${financialRecords.date} <= ${parseFilterTo(to)}`)
  }

  const joinCondition = dateConditions.length === 1
    ? dateConditions[0]
    : sql.join(dateConditions, sql` AND `)

  const rows = await db
    .select({
      unitId: units.id,
      unitNumber: units.number,
      unitLabel: units.label,
      balance: sql<string>`COALESCE(
        SUM(
          CASE WHEN ${financialRecords.type} = 'abono' THEN ${financialRecords.amount}
               WHEN ${financialRecords.type} = 'cargo' THEN -${financialRecords.amount}
               ELSE 0
          END
        ),
        0
      )::numeric(12,2)`.as('balance'),
      lastMovementDate: sql<string | null>`MAX(${financialRecords.date})`.as('last_movement_date'),
    })
    .from(units)
    .leftJoin(financialRecords, joinCondition)
    .where(eq(units.tenantId, session.tenantId))
    .groupBy(units.id, units.number, units.label)
    .orderBy(asc(units.number))

  const data: UnitSummary[] = rows.map((row) => {
    const balance = row.balance ?? '0.00'
    return {
      unitId: row.unitId,
      unitNumber: row.unitNumber,
      unitLabel: row.unitLabel,
      balance,
      isInDebt: parseFloat(balance) < 0,
      lastMovementDate: row.lastMovementDate ? new Date(row.lastMovementDate).toISOString() : null,
    }
  })

  // Aggregate totals — separate query for accurate sums
  const totalsConditions: ReturnType<typeof sql>[] = [
    eq(financialRecords.tenantId, session.tenantId),
  ]
  if (from) totalsConditions.push(gte(financialRecords.date, parseFilterFrom(from)))
  if (to) totalsConditions.push(lte(financialRecords.date, parseFilterTo(to)))

  const [totals] = await db
    .select({
      totalCobrado: sql<number>`cast(coalesce(sum(case when ${financialRecords.type} = 'abono' then cast(${financialRecords.amount} as numeric) else 0 end), 0) as float)`,
      totalCargado: sql<number>`cast(coalesce(sum(case when ${financialRecords.type} = 'cargo' then cast(${financialRecords.amount} as numeric) else 0 end), 0) as float)`,
    })
    .from(financialRecords)
    .where(and(...totalsConditions))

  return {
    data,
    totals: {
      totalCobrado: totals?.totalCobrado ?? 0,
      totalCargado: totals?.totalCargado ?? 0,
      pendiente: (totals?.totalCargado ?? 0) - (totals?.totalCobrado ?? 0),
    },
  }
})
