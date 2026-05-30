import { db } from '~~/server/db'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { tenantId } = session
  const unitId = (session.user as Record<string, unknown>).unitId as string

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
  }

  const staffId = getRouterParam(event, 'id')
  if (!staffId) {
    throw createError({ statusCode: 400, message: 'Staff ID es requerido' })
  }

  const [deactivated] = await db
    .update(unitServiceStaff)
    .set({ isActive: false })
    .where(
      and(
        eq(unitServiceStaff.id, staffId),
        eq(unitServiceStaff.unitId, unitId),
        eq(unitServiceStaff.tenantId, tenantId),
      ),
    )
    .returning()

  if (!deactivated) {
    throw createError({ statusCode: 404, message: 'Personal de servicio no encontrado' })
  }

  return { data: deactivated }
})
