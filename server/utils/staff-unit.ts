import { db } from '~~/server/db'
import { staff } from '~~/server/db/schema/staff'
import { user } from '~~/server/db/schema/auth'
import { units } from '~~/server/db/schema/unit'
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

/**
 * Obtiene el unitId para un usuario según su rol.
 * - conserje: desde staff table (obligatorio, sin fallbacks)
 * - propietario/admin: desde la tabla user (obligatorio)
 */
export async function getUnitIdForPass(userId: string, tenantId: string, role: string): Promise<string> {
  if (role === 'conserje') {
    const [staffRecord] = await db
      .select({ unitId: staff.unitId })
      .from(staff)
      .where(and(eq(staff.userId, userId), eq(staff.tenantId, tenantId)))
      .limit(1)

    if (!staffRecord?.unitId) {
      throw createError({ statusCode: 400, message: 'Conserje sin unidad asignada. Contacta al administrador.' })
    }
    return staffRecord.unitId
  }

  // propietario/admin: user table
  const [userData] = await db
    .select({ unitId: user.unitId })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  if (!userData?.unitId) {
    throw createError({ statusCode: 400, message: 'Usuario sin unidad asignada' })
  }
  return userData.unitId
}

/**
 * Obtiene los datos de la unidad (number, label) para un unitId.
 */
export async function getUnitDetails(unitId: string): Promise<{ number: string; label: string | null }> {
  const [unit] = await db
    .select({ number: units.number, label: units.label })
    .from(units)
    .where(eq(units.id, unitId))
    .limit(1)

  return unit ?? { number: '', label: null }
}
