import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { units } from '~~/server/db/schema/unit'
import { staff } from '~~/server/db/schema/staff'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  const [profile] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      cedula: user.cedula,
      image: user.image,
      role: user.role,
      unitId: user.unitId,
      unitNumber: units.number,
      unitLabel: units.label,
      createdAt: user.createdAt,
    })
    .from(user)
    .leftJoin(units, eq(user.unitId, units.id))
    .where(eq(user.id, session.user.id))

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Perfil no encontrado' })
  }

  // Para conserje: resolver rancho desde staff.unitId si user.unitId es null
  if (profile.role === 'conserje' && !profile.unitId) {
    const [staffRecord] = await db
      .select({
        unitId: staff.unitId,
        unitNumber: units.number,
        unitLabel: units.label,
      })
      .from(staff)
      .leftJoin(units, eq(units.id, staff.unitId))
      .where(
        and(
          eq(staff.userId, profile.id),
          eq(staff.isActive, true),
        ),
      )
      .limit(1)

    if (staffRecord?.unitId) {
      profile.unitId = staffRecord.unitId
      profile.unitNumber = staffRecord.unitNumber
      profile.unitLabel = staffRecord.unitLabel
    }
  }

  return { data: profile }
})
