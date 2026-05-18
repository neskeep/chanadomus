import { db } from '~~/server/db'
import { staff } from '~~/server/db/schema/staff'
import { units } from '~~/server/db/schema/unit'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { tenantId, user } = await requireTenant(event)
  await requireRole(event, ['conserje'])

  const [record] = await db
    .select({
      unitId: staff.unitId,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(staff)
    .leftJoin(units, eq(units.id, staff.unitId))
    .where(
      and(
        eq(staff.userId, user.id),
        eq(staff.tenantId, tenantId),
        eq(staff.isActive, true),
      ),
    )
    .limit(1)

  if (!record?.unitId) {
    throw createError({ statusCode: 403, message: 'Staff sin unidad asignada' })
  }

  return {
    data: {
      unitId: record.unitId,
      unitNumber: record.unitNumber,
      unitLabel: record.unitLabel,
    },
  }
})
