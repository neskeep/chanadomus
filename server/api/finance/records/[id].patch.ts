import { z } from 'zod'
import { db } from '~~/server/db'
import { financialRecords } from '~~/server/db/schema/financial'
import { eq, and } from 'drizzle-orm'
import type { FinancialRecord } from '~~/shared/types/financial'

const updateRecordSchema = z.object({
  type: z.enum(['cargo', 'abono'], { message: 'type debe ser "cargo" o "abono"' }).optional(),
  category: z.enum(['ordinaria', 'extraordinaria'], { message: 'category debe ser "ordinaria" o "extraordinaria"' }).optional(),
  amount: z.number().positive('amount debe ser un numero mayor a 0').optional(),
  description: z.string().min(1, 'description no puede estar vacio').optional(),
  date: z.string().refine((v) => !isNaN(new Date(v).getTime()), 'date debe ser una fecha valida').optional(),
}).refine((data) => Object.keys(data).length > 0, { message: 'No se proporcionaron campos para actualizar' })

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

  const body = await validateBody(event, updateRecordSchema)
  const updates: Record<string, unknown> = {}

  if (body.type !== undefined) {
    updates.type = body.type
  }

  if (body.category !== undefined) {
    updates.category = body.category
  }

  if (body.amount !== undefined) {
    updates.amount = String(body.amount)
  }

  if (body.description !== undefined) {
    updates.description = body.description.trim()
  }

  if (body.date !== undefined) {
    updates.date = new Date(body.date)
  }

  const [row] = await db
    .update(financialRecords)
    .set(updates)
    .where(and(
      eq(financialRecords.id, id),
      eq(financialRecords.tenantId, session.tenantId),
    ))
    .returning()

  if (!row) throw createError({ statusCode: 404, message: 'Registro no encontrado' })

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
