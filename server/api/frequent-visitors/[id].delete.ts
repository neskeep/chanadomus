import { db } from '~~/server/db'
import { frequentVisitors } from '~~/server/db/schema/frequent-visitor'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { tenantId, user } = await requireTenant(event)
  const session = await requireRole(event, ['propietario', 'admin', 'conserje'])
  const role = session.user.role

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID es requerido' })
  }

  // Verificar que el visitante existe y pertenece al usuario/unidad
  const [existing] = await db
    .select({ id: frequentVisitors.id, ownerId: frequentVisitors.ownerId, unitId: frequentVisitors.unitId })
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

  // Verificar que el visitante pertenece a la unidad del usuario (propietario y conserje comparten)
  if (role !== 'admin') {
    const userUnitId = await getUnitIdForPass(user.id, tenantId, role as string)
    if (!userUnitId || existing.unitId !== userUnitId) {
      throw createError({ statusCode: 403, message: 'No tienes permiso para eliminar este visitante' })
    }
  }

  await db
    .delete(frequentVisitors)
    .where(eq(frequentVisitors.id, id))

  return { success: true }
})
