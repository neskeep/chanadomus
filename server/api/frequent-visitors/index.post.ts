import { db } from '~~/server/db'
import { frequentVisitors } from '~~/server/db/schema/frequent-visitor'
import { units } from '~~/server/db/schema/unit'
import { eq, and } from 'drizzle-orm'
import type { CreateFrequentVisitor } from '~~/shared/types/frequent-visitor'

export default defineEventHandler(async (event) => {
  const { tenantId, user } = await requireTenant(event)
  await requireRole(event, ['propietario', 'admin'])

  const body = await readBody<CreateFrequentVisitor>(event)

  // Validar campos requeridos
  if (!body.visitorName?.trim()) {
    throw createError({ statusCode: 400, message: 'visitorName es requerido' })
  }
  if (!body.visitorType || !['invitado', 'proveedor'].includes(body.visitorType)) {
    throw createError({ statusCode: 400, message: 'visitorType debe ser "invitado" o "proveedor"' })
  }
  if (!body.unitId?.trim()) {
    throw createError({ statusCode: 400, message: 'unitId es requerido' })
  }

  // Verificar que la unidad existe y pertenece al tenant
  const [unit] = await db
    .select({ id: units.id })
    .from(units)
    .where(and(eq(units.id, body.unitId), eq(units.tenantId, tenantId)))
    .limit(1)

  if (!unit) {
    throw createError({ statusCode: 404, message: 'Unidad no encontrada' })
  }

  const rows = await db
    .insert(frequentVisitors)
    .values({
      ownerId: user.id,
      unitId: body.unitId,
      visitorName: body.visitorName.trim(),
      visitorDocument: body.visitorDocument?.trim() || null,
      visitorType: body.visitorType,
      vehiclePlate: body.vehiclePlate?.trim() || null,
      tenantId,
    })
    .returning()

  const created = rows[0]
  if (!created) {
    throw createError({ statusCode: 500, message: 'Error al crear visitante frecuente' })
  }

  return {
    data: {
      ...created,
      lastVisitAt: created.lastVisitAt?.toISOString() ?? null,
      createdAt: created.createdAt.toISOString(),
    },
  }
})
