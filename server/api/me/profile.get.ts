import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { units } from '~~/server/db/schema/unit'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  const [profile] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
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

  return { data: profile }
})
