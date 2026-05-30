import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schema mirrored from server/api/finance/records.post.ts — must stay in sync
const createRecordSchema = z.object({
  unitId: z.string().min(1, 'unitId es requerido'),
  type: z.enum(['cargo', 'abono'], { message: 'type debe ser "cargo" o "abono"' }),
  amount: z.number().positive('amount debe ser un numero mayor a 0'),
  description: z.string().min(1, 'description es requerido y no puede estar vacio'),
  category: z.enum(['ordinaria', 'extraordinaria'], { message: 'category debe ser "ordinaria" o "extraordinaria"' }),
  date: z.string().min(1, 'date es requerido').refine((v) => !isNaN(new Date(v).getTime()), 'date debe ser una fecha valida en formato ISO'),
})

// Schema mirrored from server/api/finance/records/[id].patch.ts — must stay in sync
const updateRecordSchema = z.object({
  type: z.enum(['cargo', 'abono'], { message: 'type debe ser "cargo" o "abono"' }).optional(),
  category: z.enum(['ordinaria', 'extraordinaria'], { message: 'category debe ser "ordinaria" o "extraordinaria"' }).optional(),
  amount: z.number().positive('amount debe ser un numero mayor a 0').optional(),
  description: z.string().min(1, 'description no puede estar vacio').optional(),
  date: z.string().refine((v) => !isNaN(new Date(v).getTime()), 'date debe ser una fecha valida').optional(),
}).refine((data) => Object.keys(data).length > 0, { message: 'No se proporcionaron campos para actualizar' })

describe('Finance - Create Record Schema', () => {
  const validRecord = {
    unitId: 'unit-123',
    type: 'cargo' as const,
    amount: 1500.50,
    description: 'Cuota mensual',
    category: 'ordinaria' as const,
    date: '2025-06-01T00:00:00.000Z',
  }

  it('accepts a valid complete record', () => {
    const result = createRecordSchema.safeParse(validRecord)
    expect(result.success).toBe(true)
  })

  it('rejects missing amount', () => {
    const { amount, ...rest } = validRecord
    const result = createRecordSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects missing type', () => {
    const { type, ...rest } = validRecord
    const result = createRecordSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects missing unitId', () => {
    const { unitId, ...rest } = validRecord
    const result = createRecordSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects empty unitId', () => {
    const result = createRecordSchema.safeParse({ ...validRecord, unitId: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid type value', () => {
    const result = createRecordSchema.safeParse({ ...validRecord, type: 'pago' })
    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const result = createRecordSchema.safeParse({ ...validRecord, amount: -100 })
    expect(result.success).toBe(false)
  })

  it('rejects zero amount', () => {
    const result = createRecordSchema.safeParse({ ...validRecord, amount: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid category', () => {
    const result = createRecordSchema.safeParse({ ...validRecord, category: 'multa' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid date string', () => {
    const result = createRecordSchema.safeParse({ ...validRecord, date: 'not-a-date' })
    expect(result.success).toBe(false)
  })

  it('rejects empty date', () => {
    const result = createRecordSchema.safeParse({ ...validRecord, date: '' })
    expect(result.success).toBe(false)
  })

  it('accepts type abono', () => {
    const result = createRecordSchema.safeParse({ ...validRecord, type: 'abono' })
    expect(result.success).toBe(true)
  })

  it('accepts category extraordinaria', () => {
    const result = createRecordSchema.safeParse({ ...validRecord, category: 'extraordinaria' })
    expect(result.success).toBe(true)
  })

  it('rejects missing description', () => {
    const { description, ...rest } = validRecord
    const result = createRecordSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects empty description', () => {
    const result = createRecordSchema.safeParse({ ...validRecord, description: '' })
    expect(result.success).toBe(false)
  })
})

describe('Finance - Update Record Schema', () => {
  it('accepts a valid partial update with one field', () => {
    const result = updateRecordSchema.safeParse({ amount: 2000 })
    expect(result.success).toBe(true)
  })

  it('accepts a valid partial update with multiple fields', () => {
    const result = updateRecordSchema.safeParse({ amount: 2000, type: 'abono' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty update (no fields)', () => {
    const result = updateRecordSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts type field alone', () => {
    const result = updateRecordSchema.safeParse({ type: 'cargo' })
    expect(result.success).toBe(true)
  })

  it('accepts category field alone', () => {
    const result = updateRecordSchema.safeParse({ category: 'extraordinaria' })
    expect(result.success).toBe(true)
  })

  it('accepts description field alone', () => {
    const result = updateRecordSchema.safeParse({ description: 'Updated desc' })
    expect(result.success).toBe(true)
  })

  it('accepts date field alone', () => {
    const result = updateRecordSchema.safeParse({ date: '2025-07-01T00:00:00.000Z' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid type in update', () => {
    const result = updateRecordSchema.safeParse({ type: 'pago' })
    expect(result.success).toBe(false)
  })

  it('rejects negative amount in update', () => {
    const result = updateRecordSchema.safeParse({ amount: -50 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid date in update', () => {
    const result = updateRecordSchema.safeParse({ date: 'invalid' })
    expect(result.success).toBe(false)
  })
})
