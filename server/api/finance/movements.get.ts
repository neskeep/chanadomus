import { db } from '~~/server/db'
import { financialRecords } from '~~/server/db/schema/financial'
import { units } from '~~/server/db/schema/unit'
import { eq, desc, sql, gte, lte, and } from 'drizzle-orm'
import type { MovementWithUnit } from '~~/shared/types/financial'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))
  const from = typeof query.from === 'string' ? query.from : undefined
  const to = typeof query.to === 'string' ? query.to : undefined
  const type = query.type === 'cargo' || query.type === 'abono' ? query.type : undefined
  const category = query.category === 'ordinaria' || query.category === 'extraordinaria' ? query.category : undefined

  const conditions = [eq(financialRecords.tenantId, session.tenantId)]
  if (from) conditions.push(gte(financialRecords.date, new Date(from)))
  if (to) conditions.push(lte(financialRecords.date, new Date(to)))
  if (type) conditions.push(eq(financialRecords.type, type))
  if (category) conditions.push(eq(financialRecords.category, category))

  const where = conditions.length === 1 ? conditions[0]! : and(...conditions)!

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(financialRecords)
    .where(where)

  const total = countResult?.count ?? 0

  const rows = await db
    .select({
      id: financialRecords.id,
      type: financialRecords.type,
      amount: financialRecords.amount,
      description: financialRecords.description,
      date: financialRecords.date,
      unitId: financialRecords.unitId,
      category: financialRecords.category,
      unitNumber: units.number,
      unitLabel: units.label,
      createdAt: financialRecords.createdAt,
    })
    .from(financialRecords)
    .innerJoin(units, eq(units.id, financialRecords.unitId))
    .where(where)
    .orderBy(desc(financialRecords.date), desc(financialRecords.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  const data: MovementWithUnit[] = rows.map(r => ({
    id: r.id,
    type: r.type,
    category: r.category,
    amount: r.amount,
    description: r.description,
    date: r.date.toISOString(),
    unitId: r.unitId,
    unitNumber: r.unitNumber,
    unitLabel: r.unitLabel,
    createdAt: r.createdAt.toISOString(),
  }))

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
})
