import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schema mirrored from server/api/providers/index.post.ts — must stay in sync
const createProviderSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre no puede exceder 200 caracteres'),
  phone: z.string().max(50, 'El telefono no puede exceder 50 caracteres').optional().nullable(),
  photo: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
  address: z.string().max(500, 'La direccion no puede exceder 500 caracteres').optional().nullable(),
  services: z.array(z.string()).optional().nullable(),
  costs: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  category: z.enum(['plomeria', 'electricidad', 'jardineria', 'cerrajeria', 'limpieza', 'pintura', 'albanileria', 'seguridad', 'fumigacion', 'otro']).optional(),
  serviceRoleId: z.string().optional().nullable(),
}).refine((data) => {
  if (!data.serviceRoleId && !data.category) return false
  return true
}, { message: 'La categoria es requerida', path: ['category'] })

describe('Provider - Create Provider Schema', () => {
  const validProviderWithCategory = {
    name: 'Plomero Juan',
    category: 'plomeria' as const,
  }

  const validProviderWithServiceRole = {
    name: 'Electricista Pedro',
    serviceRoleId: 'role-123',
  }

  it('accepts a valid provider with category', () => {
    const result = createProviderSchema.safeParse(validProviderWithCategory)
    expect(result.success).toBe(true)
  })

  it('accepts a valid provider with serviceRoleId', () => {
    const result = createProviderSchema.safeParse(validProviderWithServiceRole)
    expect(result.success).toBe(true)
  })

  it('accepts a provider with both category and serviceRoleId', () => {
    const result = createProviderSchema.safeParse({
      ...validProviderWithCategory,
      serviceRoleId: 'role-456',
    })
    expect(result.success).toBe(true)
  })

  it('rejects provider without category OR serviceRoleId', () => {
    const result = createProviderSchema.safeParse({ name: 'Solo Nombre' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const categoryError = result.error.issues.find((i) => i.path.includes('category'))
      expect(categoryError).toBeDefined()
    }
  })

  it('rejects provider with null serviceRoleId and no category', () => {
    const result = createProviderSchema.safeParse({ name: 'Test', serviceRoleId: null })
    expect(result.success).toBe(false)
  })

  it('rejects missing name', () => {
    const { name, ...rest } = validProviderWithCategory
    const result = createProviderSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = createProviderSchema.safeParse({ ...validProviderWithCategory, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name over 200 chars', () => {
    const result = createProviderSchema.safeParse({ ...validProviderWithCategory, name: 'a'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('accepts name at exactly 200 chars', () => {
    const result = createProviderSchema.safeParse({ ...validProviderWithCategory, name: 'a'.repeat(200) })
    expect(result.success).toBe(true)
  })

  it('accepts all valid category values', () => {
    const categories = ['plomeria', 'electricidad', 'jardineria', 'cerrajeria', 'limpieza', 'pintura', 'albanileria', 'seguridad', 'fumigacion', 'otro'] as const
    for (const category of categories) {
      const result = createProviderSchema.safeParse({ name: 'Test Provider', category })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid category value', () => {
    const result = createProviderSchema.safeParse({ name: 'Test', category: 'carpinteria' })
    expect(result.success).toBe(false)
  })

  it('accepts optional phone', () => {
    const result = createProviderSchema.safeParse({ ...validProviderWithCategory, phone: '555-1234' })
    expect(result.success).toBe(true)
  })

  it('rejects phone over 50 chars', () => {
    const result = createProviderSchema.safeParse({ ...validProviderWithCategory, phone: 'x'.repeat(51) })
    expect(result.success).toBe(false)
  })

  it('accepts optional address', () => {
    const result = createProviderSchema.safeParse({ ...validProviderWithCategory, address: 'Calle Falsa 123' })
    expect(result.success).toBe(true)
  })

  it('rejects address over 500 chars', () => {
    const result = createProviderSchema.safeParse({ ...validProviderWithCategory, address: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('accepts optional services array', () => {
    const result = createProviderSchema.safeParse({ ...validProviderWithCategory, services: ['Reparacion de tuberias', 'Instalacion'] })
    expect(result.success).toBe(true)
  })

  it('accepts null optional fields', () => {
    const result = createProviderSchema.safeParse({
      ...validProviderWithCategory,
      phone: null,
      photo: null,
      schedule: null,
      address: null,
      services: null,
      costs: null,
      notes: null,
    })
    expect(result.success).toBe(true)
  })
})
