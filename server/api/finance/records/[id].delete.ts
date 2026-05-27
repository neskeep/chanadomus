import { db } from '~~/server/db'
import { financialRecords } from '~~/server/db/schema/financial'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'id es requerido' })
  }

  // Verificar que el registro existe y pertenece al tenant
  const [existing] = await db
    .select({ id: financialRecords.id })
    .from(financialRecords)
    .where(and(
      eq(financialRecords.id, id),
      eq(financialRecords.tenantId, session.tenantId),
    ))

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Registro no encontrado' })
  }

  await db
    .delete(financialRecords)
    .where(and(
      eq(financialRecords.id, id),
      eq(financialRecords.tenantId, session.tenantId),
    ))

  return { success: true }
})
