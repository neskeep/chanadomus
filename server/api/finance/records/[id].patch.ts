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

  // Verificar que el registro existe y pertenece al tenant
  const [existing] = await db
    .select()
    .from(financialRecords)
    .where(and(
      eq(financialRecords.id, id),
      eq(financialRecords.tenantId, session.tenantId),
    ))

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Registro no encontrado' })
  }

  const body = await readBody(event)
  const updates: Record<string, unknown> = {}

  // Validar campos opcionales
  if (body.type !== undefined) {
    if (body.type !== 'cargo' && body.type !== 'abono') {
      throw createError({ statusCode: 400, message: 'type debe ser "cargo" o "abono"' })
    }
    updates.type = body.type
  }

  if (body.category !== undefined) {
    if (body.category !== 'ordinaria' && body.category !== 'extraordinaria') {
      throw createError({ statusCode: 400, message: 'category debe ser "ordinaria" o "extraordinaria"' })
    }
    updates.category = body.category
  }

  if (body.amount !== undefined) {
    const parsedAmount = parseFloat(String(body.amount))
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw createError({ statusCode: 400, message: 'amount debe ser un numero mayor a 0' })
    }
    updates.amount = String(parsedAmount)
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || body.description.trim() === '') {
      throw createError({ statusCode: 400, message: 'description no puede estar vacio' })
    }
    updates.description = body.description.trim()
  }

  if (body.date !== undefined) {
    if (typeof body.date !== 'string') {
      throw createError({ statusCode: 400, message: 'date debe ser un string ISO' })
    }
    const parsedDate = new Date(body.date)
    if (isNaN(parsedDate.getTime())) {
      throw createError({ statusCode: 400, message: 'date debe ser una fecha valida' })
    }
    updates.date = parsedDate
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No se proporcionaron campos para actualizar' })
  }

  const [row] = await db
    .update(financialRecords)
    .set(updates)
    .where(and(
      eq(financialRecords.id, id),
      eq(financialRecords.tenantId, session.tenantId),
    ))
    .returning()

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
