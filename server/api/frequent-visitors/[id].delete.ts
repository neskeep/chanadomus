import { db } from '~~/server/db'
import { frequentVisitors } from '~~/server/db/schema/frequent-visitor'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { tenantId, user } = await requireTenant(event)
  await requireRole(event, ['propietario', 'admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID es requerido' })
  }

  // Verificar que el visitante existe y pertenece al usuario
  const [existing] = await db
    .select({ id: frequentVisitors.id, ownerId: frequentVisitors.ownerId })
    .from(frequentVisitors)
    .where(
      and(
        eq(frequentVisitors.id, id),
        eq(frequentVisitors.tenantId, tenantId),
      ),
    )
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Visitante frecuente no encontrado' })
  }

  if (existing.ownerId !== user.id) {
    throw createError({ statusCode: 403, message: 'No tienes permiso para eliminar este visitante' })
  }

  await db
    .delete(frequentVisitors)
    .where(eq(frequentVisitors.id, id))

  return { success: true }
})
