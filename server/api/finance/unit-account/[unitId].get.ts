import { db } from '~~/server/db'
import { financialRecords } from '~~/server/db/schema/financial'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import type { AccountStatement, FinancialRecord } from '~~/shared/types/financial'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const unitId = getRouterParam(event, 'unitId')
  if (!unitId) {
    throw createError({ statusCode: 400, message: 'unitId is required' })
  }

  const query = getQuery(event)
  const from = typeof query.from === 'string' ? query.from : undefined
  const to = typeof query.to === 'string' ? query.to : undefined

  // Build WHERE conditions
  const conditions = [
    eq(financialRecords.tenantId, session.tenantId),
    eq(financialRecords.unitId, unitId),
  ]
  if (from) {
    conditions.push(gte(financialRecords.date, parseFilterFrom(from)))
  }
  if (to) {
    conditions.push(lte(financialRecords.date, parseFilterTo(to)))
  }

  const rows = await db
    .select()
    .from(financialRecords)
    .where(and(...conditions))
    .orderBy(desc(financialRecords.date))

  const records: FinancialRecord[] = rows.map((row) => ({
    id: row.id,
    unitId: row.unitId,
    type: row.type,
    category: row.category,
    amount: row.amount,
    description: row.description,
    date: row.date.toISOString(),
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
  }))

  // Calculate balance: abonos positive, cargos negative
  const balanceResult = await db
    .select({
      balance: sql<string>`COALESCE(
        SUM(
          CASE WHEN ${financialRecords.type} = 'abono' THEN ${financialRecords.amount}
               WHEN ${financialRecords.type} = 'cargo' THEN -${financialRecords.amount}
               ELSE 0
          END
        ),
        0
      )::numeric(12,2)`,
    })
    .from(financialRecords)
    .where(and(...conditions))

  const balance = balanceResult[0]?.balance ?? '0.00'

  const data: AccountStatement = {
    balance,
    records,
  }

  return { data }
})
