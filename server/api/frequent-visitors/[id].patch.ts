import { db } from '~~/server/db'
import { frequentVisitors } from '~~/server/db/schema/frequent-visitor'
import { eq, and } from 'drizzle-orm'
import type { UpdateFrequentVisitor } from '~~/shared/types/frequent-visitor'

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
      throw createError({ statusCode: 403, message: 'No tienes permiso para editar este visitante' })
    }
  }

  const body = await readBody<UpdateFrequentVisitor>(event)

  // Construir campos a actualizar
  const updates: Record<string, unknown> = {}
  if (body.visitorName !== undefined) {
    if (!body.visitorName.trim()) {
      throw createError({ statusCode: 400, message: 'visitorName no puede estar vacio' })
    }
    updates.visitorName = body.visitorName.trim()
  }
  if (body.visitorDocument !== undefined) {
    updates.visitorDocument = body.visitorDocument?.trim() || null
  }
  if (body.visitorType !== undefined) {
    if (!['invitado', 'proveedor'].includes(body.visitorType)) {
      throw createError({ statusCode: 400, message: 'visitorType debe ser "invitado" o "proveedor"' })
    }
    updates.visitorType = body.visitorType
  }
  if (body.vehiclePlate !== undefined) {
    updates.vehiclePlate = body.vehiclePlate?.trim() || null
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No se proporcionaron campos para actualizar' })
  }

  const rows = await db
    .update(frequentVisitors)
    .set(updates)
    .where(eq(frequentVisitors.id, id))
    .returning()

  const updated = rows[0]
  if (!updated) {
    throw createError({ statusCode: 500, message: 'Error al actualizar visitante frecuente' })
  }

  return {
    data: {
      ...updated,
      lastVisitAt: updated.lastVisitAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    },
  }
})
