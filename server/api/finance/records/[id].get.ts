import { db } from '~~/server/db'
import { financialRecords } from '~~/server/db/schema/financial'
import { eq, and } from 'drizzle-orm'
import type { FinancialRecord } from '~~/shared/types/financial'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'id es requerido' })
  }

  const [row] = await db
    .select()
    .from(financialRecords)
    .where(and(
      eq(financialRecords.id, id),
      eq(financialRecords.tenantId, session.tenantId),
    ))

  if (!row) {
    throw createError({ statusCode: 404, message: 'Registro no encontrado' })
  }

  const record: FinancialRecord = {
    id: row.id,
    unitId: row.unitId,
    type: row.type,
    category: row.category,
    amount: row.amount,
    description: row.description,
    date: row.date.toISOString(),
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
  }

  return { data: record }
})
