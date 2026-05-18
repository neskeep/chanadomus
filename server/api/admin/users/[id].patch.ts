import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { eq, and } from 'drizzle-orm'
import { USER_ROLES, type UserRole } from '~~/shared/types/auth'

interface UpdateBody {
  name?: string
  email?: string
  role?: UserRole
  unitId?: string | null
  phone?: string | null
}

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
  const id = getRouterParam(event, 'id')

  if (!id) throw createError({ statusCode: 400, message: 'ID requerido' })

  const body = await readBody<UpdateBody>(event)

  if (body.role && !USER_ROLES.includes(body.role)) {
    throw createError({ statusCode: 400, message: 'Rol invalido' })
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.email !== undefined) updates.email = body.email.trim().toLowerCase()
  if (body.role !== undefined) updates.role = body.role
  if (body.unitId !== undefined) updates.unitId = body.unitId || null
  if (body.phone !== undefined) updates.phone = body.phone?.trim() || null

  if (Object.keys(updates).length === 1) {
    throw createError({ statusCode: 400, message: 'No se proporcionaron campos para actualizar' })
  }

  const [updated] = await db
    .update(user)
    .set(updates)
    .where(and(eq(user.id, id), eq(user.tenantId, tenantId)))
    .returning()

  if (!updated) throw createError({ statusCode: 404, message: 'Usuario no encontrado' })

  return { data: updated }
})
