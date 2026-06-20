import { z } from 'zod'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '~~/server/db'
import { financialRecords } from '~~/server/db/schema/financial'

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Debe seleccionar al menos un registro').max(500),
})

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const { ids } = await validateBody(event, bulkDeleteSchema)

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

  await db
    .delete(financialRecords)
    .where(and(
      eq(financialRecords.tenantId, session.tenantId),
      inArray(financialRecords.id, ids),
    ))

  return { data: { deleted: existing.length } }
})
