import { z } from 'zod'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '~~/server/db'
import { financialRecords } from '~~/server/db/schema/financial'

const bulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'Debe seleccionar al menos un registro').max(500),
  updates: z.object({
    date: z.string().refine(v => !isNaN(new Date(v).getTime()), 'date invalida').optional(),
    type: z.enum(['cargo', 'abono']).optional(),
    category: z.enum(['ordinaria', 'extraordinaria']).optional(),
    amount: z.number().positive('El monto debe ser positivo').optional(),
  }).refine(data => Object.keys(data).length > 0, 'No se proporcionaron campos para actualizar'),
})

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const { ids, updates } = await validateBody(event, bulkUpdateSchema)

  // Verify all IDs belong to tenant
  const existing = await db
    .select({ id: financialRecords.id })
    .from(financialRecords)
    .where(and(
      eq(financialRecords.tenantId, session.tenantId),
      inArray(financialRecords.id, ids),
    ))

  if (existing.length !== ids.length) {
    throw createError({ statusCode: 404, message: 'Algunos registros no encontrados' })
  }

  const setValues: Record<string, unknown> = {}
  if (updates.date) setValues.date = parseFinanceDate(updates.date)
  if (updates.type) setValues.type = updates.type
  if (updates.category) setValues.category = updates.category
  if (updates.amount !== undefined) setValues.amount = String(updates.amount)

  await db
    .update(financialRecords)
    .set(setValues)
    .where(and(
      eq(financialRecords.tenantId, session.tenantId),
      inArray(financialRecords.id, ids),
    ))

  return { data: { updated: ids.length } }
})
