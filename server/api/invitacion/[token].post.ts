import { z } from 'zod'
import { db } from '~~/server/db'
import { invitations } from '~~/server/db/schema/invitation'
import { user, account } from '~~/server/db/schema/auth'
import { eq } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'

const registerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email invalido').min(1, 'El email es requerido'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
  phone: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({ statusCode: 400, message: 'Token de invitacion requerido' })
  }

  const body = await validateBody(event, registerSchema)

  // Look up invitation
  const [invitation] = await db
    .select({
      id: invitations.id,
      unitId: invitations.unitId,
      tenantId: invitations.tenantId,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
      usedAt: invitations.usedAt,
      revokedAt: invitations.revokedAt,
    })
    .from(invitations)
    .where(eq(invitations.token, token))

  if (!invitation) {
    throw createError({ statusCode: 400, message: 'Invitacion no valida' })
  }

  if (invitation.revokedAt) {
    throw createError({ statusCode: 400, message: 'Esta invitacion fue revocada' })
  }

  if (invitation.usedAt) {
    throw createError({ statusCode: 400, message: 'Esta invitacion ya fue utilizada' })
  }

  if (invitation.expiresAt < new Date()) {
    throw createError({ statusCode: 400, message: 'Esta invitacion ha expirado' })
  }

  // Check email uniqueness
  const email = body.email.trim().toLowerCase()
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))

  if (existing) {
    throw createError({ statusCode: 409, message: 'Ya existe un usuario con ese email' })
  }

  // Create user and mark invitation as used
  const userId = crypto.randomUUID()
  const now = new Date()
  const hashed = await hashPassword(body.password)

  await db.insert(user).values({
    id: userId,
    name: body.name.trim(),
    email,
    emailVerified: true,
    role: invitation.role,
    tenantId: invitation.tenantId,
    unitId: invitation.unitId,
    phone: body.phone?.trim() || null,
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: 'credential',
    userId,
    password: hashed,
    createdAt: now,
    updatedAt: now,
  })

  // Mark invitation as used
  await db
    .update(invitations)
    .set({ usedAt: now, updatedAt: now })
    .where(eq(invitations.id, invitation.id))

  setResponseStatus(event, 201)
  return { data: { success: true, role: invitation.role } }
})
