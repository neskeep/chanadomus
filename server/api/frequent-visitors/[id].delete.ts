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

  // Conserje puede eliminar visitantes de su unidad; propietario/admin solo los suyos
  if (role === 'conserje') {
    const staffUnitId = await getStaffUnitId(user.id, tenantId)
    if (existing.unitId !== staffUnitId) {
      throw createError({ statusCode: 403, message: 'No tienes permiso para eliminar este visitante' })
    }
  } else if (role !== 'admin' && existing.ownerId !== user.id) {
    throw createError({ statusCode: 403, message: 'No tienes permiso para eliminar este visitante' })
  }

  await db
    .delete(frequentVisitors)
    .where(eq(frequentVisitors.id, id))

  return { success: true }
})
