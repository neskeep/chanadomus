import { db } from '~~/server/db'
import { financialRecords } from '~~/server/db/schema/financial'
import type { FinancialRecord } from '~~/shared/types/financial'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const body = await readBody(event)

  // Validar campos requeridos
  const { unitId, type, amount, description, date } = body ?? {}

  if (!unitId || typeof unitId !== 'string') {
    throw createError({ statusCode: 400, message: 'unitId es requerido y debe ser un string' })
  }

  if (type !== 'cargo' && type !== 'abono') {
    throw createError({ statusCode: 400, message: 'type debe ser "cargo" o "abono"' })
  }

  if (amount === undefined || amount === null || amount === '') {
    throw createError({ statusCode: 400, message: 'amount es requerido' })
  }

  const parsedAmount = parseFloat(String(amount))
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw createError({ statusCode: 400, message: 'amount debe ser un numero mayor a 0' })
  }

  if (!description || typeof description !== 'string' || description.trim() === '') {
    throw createError({ statusCode: 400, message: 'description es requerido y no puede estar vacio' })
  }

  if (!date || typeof date !== 'string') {
    throw createError({ statusCode: 400, message: 'date es requerido y debe ser un string ISO' })
  }

  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) {
    throw createError({ statusCode: 400, message: 'date debe ser una fecha valida en formato ISO' })
  }

  // Insertar registro
  const [row] = await db
    .insert(financialRecords)
    .values({
      unitId,
      type,
      amount: String(parsedAmount),
      description: description.trim(),
      date: parsedDate,
      createdById: session.user.id,
      tenantId: session.tenantId,
    })
    .returning()

  // Mapear a tipo del contrato
  const record: FinancialRecord = {
    id: row.id,
    unitId: row.unitId,
    type: row.type,
    amount: row.amount,
    description: row.description,
    date: row.date.toISOString(),
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
  }

  return { data: record }
})
