import { db } from '~~/server/db'
import { financialRecords } from '~~/server/db/schema/financial'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import type { FinancialRecord, AccountStatement } from '~~/shared/types/financial'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['propietario', 'admin'])

  const unitId = (session.user as Record<string, unknown>).unitId as string | undefined
  if (!unitId) {
    throw createError({ statusCode: 400, message: 'Usuario sin unidad asignada' })
  }

  // Parse optional date filters
  const query = getQuery(event)
  const from = typeof query.from === 'string' ? query.from : undefined
  const to = typeof query.to === 'string' ? query.to : undefined

  // Build WHERE conditions
  const conditions = [
    eq(financialRecords.unitId, unitId),
    eq(financialRecords.tenantId, session.tenantId),
  ]
  if (from) {
    conditions.push(gte(financialRecords.date, parseFilterFrom(from)))
  }
  if (to) {
    conditions.push(lte(financialRecords.date, parseFilterTo(to)))
  }

  // Query movimientos de la unidad
  const rows = await db
    .select()
    .from(financialRecords)
    .where(and(...conditions))
    .orderBy(desc(financialRecords.date))

  // Calcular saldo: abonos positivos, cargos negativos
  let balance = 0
  for (const row of rows) {
    const amount = parseFloat(row.amount)
    balance += row.type === 'abono' ? amount : -amount
  }

  // Mapear a tipos del contrato
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

  return {
    data: {
      balance: balance.toFixed(2),
      records,
    } satisfies AccountStatement,
  }
})
