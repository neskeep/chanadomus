import { db } from '~~/server/db'
import { account } from '~~/server/db/schema/auth'
import { eq, and } from 'drizzle-orm'
import { hashPassword, verifyPassword } from 'better-auth/crypto'

interface PasswordChangeBody {
  currentPassword: string
  newPassword: string
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const userId = session.user.id

  const body = await readBody<PasswordChangeBody>(event)

  if (!body.currentPassword || !body.newPassword) {
    throw createError({ statusCode: 400, message: 'Campos requeridos: currentPassword, newPassword' })
  }

  if (body.newPassword.length < 8) {
    throw createError({ statusCode: 400, message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  }

  // Get current account with credential provider
  const [currentAccount] = await db
    .select({ password: account.password })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))

  if (!currentAccount?.password) {
    throw createError({ statusCode: 404, message: 'Cuenta de credenciales no encontrada' })
  }

  // Verify current password
  const isValid = await verifyPassword({
    hash: currentAccount.password,
    password: body.currentPassword,
  })

  if (!isValid) {
    throw createError({ statusCode: 400, message: 'Contraseña actual incorrecta' })
  }

  // Hash and update new password
  const hashed = await hashPassword(body.newPassword)

  await db
    .update(account)
    .set({ password: hashed, updatedAt: new Date() })
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))

  return { success: true }
})
