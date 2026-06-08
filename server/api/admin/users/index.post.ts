import { z } from 'zod'
import { db } from '~~/server/db'
import { user, account } from '~~/server/db/schema/auth'
import { staff } from '~~/server/db/schema/staff'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { eq, and } from 'drizzle-orm'
import { hashPassword } from 'better-auth/crypto'
import { USER_ROLES, type UserRole } from '~~/shared/types/auth'

const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email invalido').min(1, 'El email es requerido'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
  role: z.enum(USER_ROLES, { message: 'Rol invalido' }),
  unitId: z.string().optional(),
  phone: z.string().optional(),
  cedula: z.string().optional(),
}).refine((data) => {
  const ROLES_REQUIRING_UNIT: UserRole[] = ['propietario', 'conserje']
  if (ROLES_REQUIRING_UNIT.includes(data.role) && !data.unitId) {
    return false
  }
  return true
}, { message: 'Este rol requiere una unidad asignada', path: ['unitId'] })

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const body = await validateBody(event, createUserSchema)

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
    cedula: body.cedula?.trim() || null,
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

  // Auto-create staff record for conserje/vigilancia roles
  const STAFF_ROLES: UserRole[] = ['conserje', 'vigilancia']
  if (STAFF_ROLES.includes(body.role)) {
    // Find matching service_staff_role by name
    const [matchingRole] = await db
      .select({ id: serviceStaffRoles.id })
      .from(serviceStaffRoles)
      .where(
        and(
          eq(serviceStaffRoles.tenantId, tenantId),
          eq(serviceStaffRoles.name, body.role === 'conserje' ? 'Conserje' : 'Vigilancia'),
        ),
      )

    await db.insert(staff).values({
      name: body.name.trim(),
      role: body.role as 'conserje' | 'vigilancia',
      roleId: matchingRole?.id ?? null,
      phone: body.phone?.trim() || null,
      userId,
      unitId: body.unitId || null,
      qrToken: crypto.randomUUID(),
      tenantId,
    })
  }

  setResponseStatus(event, 201)
  return { data: { id: userId, name: body.name.trim(), email: body.email.trim().toLowerCase(), role: body.role } }
})
