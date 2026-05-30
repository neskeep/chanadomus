import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const USER_ROLES = ['admin', 'propietario', 'conserje', 'vigilancia'] as const

// Schema mirrored from server/api/admin/users/index.post.ts — must stay in sync
const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email invalido').min(1, 'El email es requerido'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
  role: z.enum(USER_ROLES, { message: 'Rol invalido' }),
  unitId: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => {
  const ROLES_REQUIRING_UNIT: (typeof USER_ROLES[number])[] = ['propietario', 'conserje']
  if (ROLES_REQUIRING_UNIT.includes(data.role) && !data.unitId) {
    return false
  }
  return true
}, { message: 'Este rol requiere una unidad asignada', path: ['unitId'] })

describe('User - Create User Schema', () => {
  const validAdmin = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'securepass123',
    role: 'admin' as const,
  }

  const validPropietario = {
    name: 'Owner User',
    email: 'owner@example.com',
    password: 'securepass123',
    role: 'propietario' as const,
    unitId: 'unit-456',
  }

  it('accepts a valid admin user creation', () => {
    const result = createUserSchema.safeParse(validAdmin)
    expect(result.success).toBe(true)
  })

  it('accepts a valid propietario with unitId', () => {
    const result = createUserSchema.safeParse(validPropietario)
    expect(result.success).toBe(true)
  })

  it('rejects propietario WITHOUT unitId', () => {
    const { unitId, ...rest } = validPropietario
    const result = createUserSchema.safeParse(rest)
    expect(result.success).toBe(false)
    if (!result.success) {
      const unitIdError = result.error.issues.find((i) => i.path.includes('unitId'))
      expect(unitIdError).toBeDefined()
    }
  })

  it('rejects conserje WITHOUT unitId', () => {
    const result = createUserSchema.safeParse({
      name: 'Conserje User',
      email: 'conserje@example.com',
      password: 'securepass123',
      role: 'conserje',
    })
    expect(result.success).toBe(false)
  })

  it('accepts admin WITHOUT unitId', () => {
    const result = createUserSchema.safeParse(validAdmin)
    expect(result.success).toBe(true)
  })

  it('accepts vigilancia WITHOUT unitId', () => {
    const result = createUserSchema.safeParse({
      ...validAdmin,
      role: 'vigilancia',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid role', () => {
    const result = createUserSchema.safeParse({
      ...validAdmin,
      role: 'superadmin',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password (< 8 chars)', () => {
    const result = createUserSchema.safeParse({
      ...validAdmin,
      password: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = createUserSchema.safeParse({
      ...validAdmin,
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing name', () => {
    const { name, ...rest } = validAdmin
    const result = createUserSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = createUserSchema.safeParse({ ...validAdmin, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing email', () => {
    const { email, ...rest } = validAdmin
    const result = createUserSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects missing password', () => {
    const { password, ...rest } = validAdmin
    const result = createUserSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects missing role', () => {
    const { role, ...rest } = validAdmin
    const result = createUserSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('accepts optional phone', () => {
    const result = createUserSchema.safeParse({
      ...validAdmin,
      phone: '+52 123 456 7890',
    })
    expect(result.success).toBe(true)
  })
})
