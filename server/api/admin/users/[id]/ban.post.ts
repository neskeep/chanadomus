import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { eq, and } from 'drizzle-orm'

interface BanBody {
  banned: boolean
  banReason?: string
}

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  const id = getRouterParam(event, 'id')

  if (!id) throw createError({ statusCode: 400, message: 'ID requerido' })

  // Prevent self-ban
  if (id === session.user.id) {
    throw createError({ statusCode: 400, message: 'No puedes suspenderte a ti mismo' })
  }

  const body = await readBody<BanBody>(event)

  if (typeof body.banned !== 'boolean') {
    throw createError({ statusCode: 400, message: 'Campo banned requerido (boolean)' })
  }

  const [updated] = await db
    .update(user)
    .set({
      banned: body.banned,
      banReason: body.banned ? (body.banReason?.trim() || null) : null,
      banExpires: null,
      updatedAt: new Date(),
    })
    .where(and(eq(user.id, id), eq(user.tenantId, tenantId)))
    .returning()

  if (!updated) throw createError({ statusCode: 404, message: 'Usuario no encontrado' })

  return { data: updated }
})
