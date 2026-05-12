import { db } from '~~/server/db'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { serviceStaffPasses } from '~~/server/db/schema/service-staff-pass'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
  const unitId = (session.user as Record<string, unknown>).unitId as string
  const staffId = getRouterParam(event, 'id')

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
  }

  if (!staffId) {
    throw createError({ statusCode: 400, message: 'ID de personal requerido' })
  }

  // Verify staff belongs to this unit
  const [staff] = await db
    .select({ id: unitServiceStaff.id })
    .from(unitServiceStaff)
    .where(
      and(
        eq(unitServiceStaff.id, staffId),
        eq(unitServiceStaff.unitId, unitId),
        eq(unitServiceStaff.tenantId, tenantId),
        eq(unitServiceStaff.isActive, true),
      ),
    )
    .limit(1)

  if (!staff) {
    throw createError({ statusCode: 404, message: 'Personal no encontrado' })
  }

  // Find active pass
  const [pass] = await db
    .select()
    .from(serviceStaffPasses)
    .where(
      and(
        eq(serviceStaffPasses.staffId, staffId),
        eq(serviceStaffPasses.isActive, true),
      ),
    )
    .limit(1)

  return { data: pass ?? null }
})
