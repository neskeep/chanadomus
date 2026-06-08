import { db } from '~~/server/db'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { staff } from '~~/server/db/schema/staff'
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

  // Check if this is a staff record (conserje) — cannot be deleted by propietario
  const [staffRecord] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(
      and(
        eq(staff.id, staffId),
        eq(staff.tenantId, tenantId),
      ),
    )
    .limit(1)

  if (staffRecord) {
    throw createError({
      statusCode: 403,
      message: 'El personal del condominio no puede ser eliminado desde aquí',
    })
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
