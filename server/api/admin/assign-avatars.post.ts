import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { requireRole } from '~~/server/utils/auth'
import { eq, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])

  const usersWithoutImage = await db
    .select({ id: user.id })
    .from(user)
    .where(isNull(user.image))

  if (usersWithoutImage.length === 0) {
    return { updated: 0, message: 'Todos los usuarios ya tienen avatar' }
  }

  for (let i = 0; i < usersWithoutImage.length; i++) {
    const imgId = (i % 70) + 1
    await db
      .update(user)
      .set({ image: `https://i.pravatar.cc/150?img=${imgId}` })
      .where(eq(user.id, usersWithoutImage[i]!.id))
  }

  return { updated: usersWithoutImage.length, message: `Avatares asignados a ${usersWithoutImage.length} usuarios` }
})
