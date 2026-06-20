import { z } from 'zod'
import { and, eq, sql, inArray } from 'drizzle-orm'
import { db } from '~~/server/db'
import { financialRecords } from '~~/server/db/schema/financial'
import { units } from '~~/server/db/schema/unit'

const bulkCreateSchema = z.object({
  unitIds: z.array(z.string().uuid()).min(1, 'Debe seleccionar al menos una unidad'),
  type: z.enum(['cargo', 'abono'], { message: 'type debe ser "cargo" o "abono"' }),
  category: z.enum(['ordinaria', 'extraordinaria'], { message: 'category invalida' }),
  amount: z.coerce.number().positive('amount debe ser mayor a 0'),
  description: z.string().min(1, 'description es requerido'),
  date: z.string().min(1).refine(v => !isNaN(new Date(v).getTime()), 'date invalida'),
  skipDuplicates: z.boolean().optional().default(true),
})

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const body = await validateBody(event, bulkCreateSchema)
  const { unitIds, type, category, amount, description, date, skipDuplicates } = body

  const parsedDate = parseFinanceDate(date)
  const trimmedDescription = description.trim()

  // Validate all unitIds belong to tenant
  const validUnits = await db
    .select({ id: units.id, number: units.number })
    .from(units)
    .where(and(
      eq(units.tenantId, session.tenantId),
      inArray(units.id, unitIds),
    ))

  if (validUnits.length !== unitIds.length) {
    throw createError({ statusCode: 400, message: 'Algunas unidades no pertenecen al tenant' })
  }

  const unitMap = new Map(validUnits.map(u => [u.id, u.number]))

  // Batch dedup check: find existing records matching the criteria for ANY of the unitIds
  const existingRecords = await db
    .select({ unitId: financialRecords.unitId })
    .from(financialRecords)
    .where(and(
      eq(financialRecords.tenantId, session.tenantId),
      inArray(financialRecords.unitId, unitIds),
      eq(financialRecords.type, type),
      eq(financialRecords.category, category),
      eq(financialRecords.amount, String(amount)),
      sql`lower(${financialRecords.description}) = lower(${trimmedDescription})`,
      sql`${financialRecords.date}::date = ${parsedDate.toISOString()}::date`,
    ))

  const existingUnitIds = new Set(existingRecords.map(r => r.unitId))

  // Filter out duplicates
  const newUnitIds = skipDuplicates
    ? unitIds.filter(id => !existingUnitIds.has(id))
    : unitIds

  if (!skipDuplicates && existingUnitIds.size > 0) {
    throw createError({
      statusCode: 409,
      message: `Ya existen registros para ${existingUnitIds.size} unidades`,
    })
  }

  let created = 0
  if (newUnitIds.length > 0) {
    const values = newUnitIds.map(unitId => ({
      unitId,
      type,
      category,
      amount: String(amount),
      description: trimmedDescription,
      date: parsedDate,
      createdById: session.user.id,
      tenantId: session.tenantId,
    }))

    const inserted = await db.insert(financialRecords).values(values).returning({ id: financialRecords.id })
    created = inserted.length
  }

  const skippedUnits = unitIds
    .filter(id => existingUnitIds.has(id))
    .map(id => unitMap.get(id) ?? id)

  return {
    data: {
      created,
      skipped: existingUnitIds.size,
      skippedUnits,
    },
  }
})
