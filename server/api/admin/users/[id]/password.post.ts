import { db } from '~~/server/db'
import { user, account } from '~~/server/db/schema/auth'
import { eq, and } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'

interface PasswordBody {
  newPassword: string
}

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  const id = getRouterParam(event, 'id')

  if (!id) throw createError({ statusCode: 400, message: 'ID requerido' })

  const body = await readBody<PasswordBody>(event)

  if (!body.newPassword || body.newPassword.length < 8) {
    throw createError({ statusCode: 400, message: 'La contrasena debe tener al menos 8 caracteres' })
  }

  // Verify user belongs to same tenant
  const [targetUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.id, id), eq(user.tenantId, tenantId)))

  if (!targetUser) throw createError({ statusCode: 404, message: 'Usuario no encontrado' })

  // Hash and update password in account table
  const hashed = await hashPassword(body.newPassword)

  const [updated] = await db
    .update(account)
    .set({ password: hashed, updatedAt: new Date() })
    .where(and(eq(account.userId, id), eq(account.providerId, 'credential')))
    .returning()

  if (!updated) throw createError({ statusCode: 404, message: 'Cuenta no encontrada' })

  return { success: true }
})
