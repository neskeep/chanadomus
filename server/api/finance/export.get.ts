import { db } from '~~/server/db'
import { financialRecords } from '~~/server/db/schema/financial'
import { units } from '~~/server/db/schema/unit'
import { eq, desc, and, gte, lte } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const query = getQuery(event)
  const from = typeof query.from === 'string' ? query.from : undefined
  const to = typeof query.to === 'string' ? query.to : undefined
  const type = query.type === 'cargo' || query.type === 'abono' ? query.type : undefined
  const category = query.category === 'ordinaria' || query.category === 'extraordinaria' ? query.category : undefined

  const conditions = [eq(financialRecords.tenantId, session.tenantId)]
  if (from) conditions.push(gte(financialRecords.date, parseFilterFrom(from)))
  if (to) conditions.push(lte(financialRecords.date, parseFilterTo(to)))
  if (type) conditions.push(eq(financialRecords.type, type))
  if (category) conditions.push(eq(financialRecords.category, category))

  const rows = await db
    .select({
      date: financialRecords.date,
      unitNumber: units.number,
      unitLabel: units.label,
      type: financialRecords.type,
      category: financialRecords.category,
      amount: financialRecords.amount,
      description: financialRecords.description,
    })
    .from(financialRecords)
    .innerJoin(units, eq(units.id, financialRecords.unitId))
    .where(conditions.length === 1 ? conditions[0]! : and(...conditions)!)
    .orderBy(desc(financialRecords.date), desc(financialRecords.createdAt))
    .limit(10000)

  // Build CSV
  const escapeCsv = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const header = 'Fecha,Unidad,Tipo,Categoría,Monto,Descripción'
  const lines = rows.map(r => {
    const dateStr = r.date.toISOString().split('T')[0]
    const unit = r.unitLabel || r.unitNumber
    const tipo = r.type === 'cargo' ? 'Cargo' : 'Abono'
    const cat = r.category === 'ordinaria' ? 'Ordinaria' : 'Extraordinaria'
    return [dateStr, escapeCsv(unit), tipo, cat, r.amount, escapeCsv(r.description)].join(',')
  })

  const csv = '\uFEFF' + header + '\n' + lines.join('\n')

  const today = new Date().toISOString().split('T')[0]
  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="movimientos-${today}.csv"`,
  })

  return csv
})
