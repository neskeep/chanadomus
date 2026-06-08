import { db } from '~~/server/db'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { serviceStaffPasses } from '~~/server/db/schema/service-staff-pass'
import { staff } from '~~/server/db/schema/staff'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { tenantId } = session
  const unitId = (session.user as Record<string, unknown>).unitId as string
  const staffId = getRouterParam(event, 'id')

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
  }

  if (!staffId) {
    throw createError({ statusCode: 400, message: 'ID de personal requerido' })
  }

  // First try unit_service_staff
  const [unitStaff] = await db
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

  if (unitStaff) {
    // Find active pass for unit service staff
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
  }

  // Check staff table (conserje)
  const [staffRecord] = await db
    .select({
      id: staff.id,
      qrToken: staff.qrToken,
      createdAt: staff.createdAt,
    })
    .from(staff)
    .where(
      and(
        eq(staff.id, staffId),
        eq(staff.unitId, unitId),
        eq(staff.tenantId, tenantId),
        eq(staff.role, 'conserje'),
        eq(staff.isActive, true),
      ),
    )
    .limit(1)

  if (!staffRecord) {
    throw createError({ statusCode: 404, message: 'Personal no encontrado' })
  }

  if (!staffRecord.qrToken) {
    return { data: null }
  }

  // Return synthetic pass object from staff.qrToken
  return {
    data: {
      id: staffRecord.id,
      staffId: staffRecord.id,
      unitId,
      token: staffRecord.qrToken,
      isActive: true,
      expiresAt: null,
      tenantId,
      createdAt: staffRecord.createdAt,
    },
  }
})
