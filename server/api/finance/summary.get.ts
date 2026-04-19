import { db } from '~~/server/db'
import { units } from '~~/server/db/schema/unit'
import { financialRecords } from '~~/server/db/schema/financial'
import { eq, sql, asc } from 'drizzle-orm'
import type { UnitSummary } from '~~/shared/types/financial'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

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
    })
    .from(units)
    .leftJoin(financialRecords, sql`${units.id} = ${financialRecords.unitId} AND ${financialRecords.tenantId} = ${units.tenantId}`)
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
    }
  })

  return { data }
})
