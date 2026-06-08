import { z } from 'zod'
import { db } from '~~/server/db'
import { financialRecords } from '~~/server/db/schema/financial'
import type { FinancialRecord } from '~~/shared/types/financial'

const createRecordSchema = z.object({
  unitId: z.string().min(1, 'unitId es requerido'),
  type: z.enum(['cargo', 'abono'], { message: 'type debe ser "cargo" o "abono"' }),
  amount: z.coerce.number().positive('amount debe ser un numero mayor a 0'),
  description: z.string().min(1, 'description es requerido y no puede estar vacio'),
  category: z.enum(['ordinaria', 'extraordinaria'], { message: 'category debe ser "ordinaria" o "extraordinaria"' }),
  date: z.string().min(1, 'date es requerido').refine((v) => !isNaN(new Date(v).getTime()), 'date debe ser una fecha valida en formato ISO'),
})

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const { unitId, type, amount, description, date, category } = await validateBody(event, createRecordSchema)

  const parsedDate = new Date(`${date}T12:00:00`)

  // Insertar registro
  const [row] = await db
    .insert(financialRecords)
    .values({
      unitId,
      type,
      category,
      amount: String(amount),
      description: description.trim(),
      date: parsedDate,
      createdById: session.user.id,
      tenantId: session.tenantId,
    })
    .returning()

  if (!row) throw createError({ statusCode: 500, message: 'Error al crear registro' })

  // Mapear a tipo del contrato
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
