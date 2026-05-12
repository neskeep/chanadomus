import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { eq } from 'drizzle-orm'

interface UpdateBody {
  name?: string
  phone?: string | null
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const body = await readBody<UpdateBody>(event)

  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (body.name !== undefined) {
    if (!body.name.trim()) {
      throw createError({ statusCode: 400, message: 'El nombre no puede estar vacío' })
    }
    updates.name = body.name.trim()
  }

  if (body.phone !== undefined) {
    updates.phone = body.phone?.trim() || null
  }

  if (Object.keys(updates).length === 1) {
    throw createError({ statusCode: 400, message: 'No se proporcionaron campos para actualizar' })
  }

  const [updated] = await db
    .update(user)
    .set(updates)
    .where(eq(user.id, session.user.id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Perfil no encontrado' })
  }

  return { data: updated }
})
