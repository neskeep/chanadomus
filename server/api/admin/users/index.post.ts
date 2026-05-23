import { db } from '~~/server/db'
import { user, account } from '~~/server/db/schema/auth'
import { eq } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'
import { USER_ROLES, type UserRole } from '~~/shared/types/auth'

interface CreateBody {
  name: string
  email: string
  password: string
  role: UserRole
  unitId?: string
  phone?: string
}

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const body = await readBody<CreateBody>(event)

  if (!body.name?.trim()) throw createError({ statusCode: 400, message: 'El nombre es requerido' })
  if (!body.email?.trim()) throw createError({ statusCode: 400, message: 'El email es requerido' })
  if (!body.password || body.password.length < 8) throw createError({ statusCode: 400, message: 'La contrasena debe tener al menos 8 caracteres' })
  if (!body.role || !USER_ROLES.includes(body.role)) throw createError({ statusCode: 400, message: 'Rol invalido' })

  // Propietarios y conserjes requieren unidad obligatoria
  const ROLES_REQUIRING_UNIT: UserRole[] = ['propietario', 'conserje']
  if (ROLES_REQUIRING_UNIT.includes(body.role) && !body.unitId) {
    throw createError({ statusCode: 400, message: 'Este rol requiere una unidad asignada' })
  }

  // Check email uniqueness
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, body.email.trim().toLowerCase()))

  if (existing) {
    throw createError({ statusCode: 409, message: 'Ya existe un usuario con ese email' })
  }

  const userId = crypto.randomUUID()
  const now = new Date()
  const hashed = await hashPassword(body.password)

  // Insert user directly (same pattern as seed)
  await db.insert(user).values({
    id: userId,
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    emailVerified: true,
    role: body.role,
    tenantId,
    unitId: body.unitId || null,
    phone: body.phone?.trim() || null,
    createdAt: now,
    updatedAt: now,
  })

  // Insert credential account
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: 'credential',
    userId,
    password: hashed,
    createdAt: now,
    updatedAt: now,
  })

  setResponseStatus(event, 201)
  return { data: { id: userId, name: body.name.trim(), email: body.email.trim().toLowerCase(), role: body.role } }
})
