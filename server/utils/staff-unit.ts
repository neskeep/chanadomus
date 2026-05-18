import { db } from '~~/server/db'
import { staff } from '~~/server/db/schema/staff'
import { eq, and } from 'drizzle-orm'

/**
 * Obtiene el unitId del staff (conserje) asociado al userId.
 * Lanza 403 si el staff no tiene unidad asignada.
 */
export async function getStaffUnitId(userId: string, tenantId: string): Promise<string> {
  const [record] = await db
    .select({ unitId: staff.unitId })
    .from(staff)
    .where(
      and(
        eq(staff.userId, userId),
        eq(staff.tenantId, tenantId),
        eq(staff.isActive, true),
      ),
    )
    .limit(1)

  if (!record?.unitId) {
    throw createError({ statusCode: 403, message: 'Staff sin unidad asignada' })
  }

  return record.unitId
}
