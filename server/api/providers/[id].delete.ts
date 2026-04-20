import { db } from '~~/server/db'
import { providers } from '~~/server/db/schema/provider'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID del proveedor es requerido' })
  }

  // Check provider exists and belongs to tenant
  const [existing] = await db
    .select({ id: providers.id })
    .from(providers)
    .where(and(eq(providers.id, id), eq(providers.tenantId, session.tenantId)))

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Proveedor no encontrado' })
  }

  // Delete provider (reviews cascade)
  await db
    .delete(providers)
    .where(and(eq(providers.id, id), eq(providers.tenantId, session.tenantId)))

  return { data: { success: true } }
})
