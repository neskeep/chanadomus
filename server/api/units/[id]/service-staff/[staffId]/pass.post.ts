import { db } from '~~/server/db'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { serviceStaffPasses } from '~~/server/db/schema/service-staff-pass'
import { eq, and } from 'drizzle-orm'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const unitId = getRouterParam(event, 'id')
  const staffId = getRouterParam(event, 'staffId')

  if (!unitId) {
    throw createError({ statusCode: 400, message: 'Unit ID is required' })
  }

  if (!staffId) {
    throw createError({ statusCode: 400, message: 'ID de personal requerido' })
  }

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

  await db
    .update(serviceStaffPasses)
    .set({ isActive: false })
    .where(
      and(
        eq(serviceStaffPasses.staffId, staffId),
        eq(serviceStaffPasses.isActive, true),
      ),
    )

  const token = crypto.randomUUID()
  const [pass] = await db
    .insert(serviceStaffPasses)
    .values({
      staffId,
      unitId,
      token,
      tenantId,
    })
    .returning()

  return { data: pass }
})
