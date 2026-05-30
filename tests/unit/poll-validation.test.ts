import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schema mirrored from server/api/polls/index.post.ts — must stay in sync
const createPollSchema = z.object({
  title: z.string().min(1, 'El titulo es requerido').max(200, 'El titulo no puede exceder 200 caracteres'),
  description: z.string().optional().nullable(),
  type: z.enum(['single', 'multiple']).default('single'),
  status: z.enum(['draft', 'active']).default('draft'),
  deadline: z.string().refine((v) => !isNaN(new Date(v).getTime()), 'Fecha limite invalida').optional().nullable(),
  options: z.array(z.string().min(1, 'Cada opcion debe ser un texto no vacio').max(500, 'Cada opcion no puede exceder 500 caracteres'))
    .min(2, 'Se requieren al menos 2 opciones')
    .max(20, 'Maximo 20 opciones permitidas'),
})

describe('Poll - Create Poll Schema', () => {
  const validPoll = {
    title: 'Propuesta de mantenimiento',
    type: 'single' as const,
    options: ['Si', 'No'],
  }

  it('accepts a valid poll with 2 options', () => {
    const result = createPollSchema.safeParse(validPoll)
    expect(result.success).toBe(true)
  })

  it('rejects less than 2 options', () => {
    const result = createPollSchema.safeParse({ ...validPoll, options: ['Solo una'] })
    expect(result.success).toBe(false)
  })

  it('rejects empty options array', () => {
    const result = createPollSchema.safeParse({ ...validPoll, options: [] })
    expect(result.success).toBe(false)
  })

  it('rejects more than 20 options', () => {
    const options = Array.from({ length: 21 }, (_, i) => `Opcion ${i + 1}`)
    const result = createPollSchema.safeParse({ ...validPoll, options })
    expect(result.success).toBe(false)
  })

  it('accepts exactly 20 options', () => {
    const options = Array.from({ length: 20 }, (_, i) => `Opcion ${i + 1}`)
    const result = createPollSchema.safeParse({ ...validPoll, options })
    expect(result.success).toBe(true)
  })

  it('rejects option text over 500 chars', () => {
    const longText = 'a'.repeat(501)
    const result = createPollSchema.safeParse({ ...validPoll, options: [longText, 'Normal'] })
    expect(result.success).toBe(false)
  })

  it('accepts option text at exactly 500 chars', () => {
    const text500 = 'a'.repeat(500)
    const result = createPollSchema.safeParse({ ...validPoll, options: [text500, 'Normal'] })
    expect(result.success).toBe(true)
  })

  it('rejects empty option text', () => {
    const result = createPollSchema.safeParse({ ...validPoll, options: ['', 'Valid'] })
    expect(result.success).toBe(false)
  })

  it('rejects title over 200 chars', () => {
    const result = createPollSchema.safeParse({ ...validPoll, title: 'a'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('accepts title at exactly 200 chars', () => {
    const result = createPollSchema.safeParse({ ...validPoll, title: 'a'.repeat(200) })
    expect(result.success).toBe(true)
  })

  it('rejects missing title', () => {
    const { title, ...rest } = validPoll
    const result = createPollSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = createPollSchema.safeParse({ ...validPoll, title: '' })
    expect(result.success).toBe(false)
  })

  it('accepts type single', () => {
    const result = createPollSchema.safeParse({ ...validPoll, type: 'single' })
    expect(result.success).toBe(true)
  })

  it('accepts type multiple', () => {
    const result = createPollSchema.safeParse({ ...validPoll, type: 'multiple' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid type', () => {
    const result = createPollSchema.safeParse({ ...validPoll, type: 'ranked' })
    expect(result.success).toBe(false)
  })

  it('defaults type to single when omitted', () => {
    const { type, ...rest } = validPoll
    const result = createPollSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('single')
    }
  })

  it('defaults status to draft when omitted', () => {
    const result = createPollSchema.safeParse(validPoll)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('draft')
    }
  })

  it('accepts optional description', () => {
    const result = createPollSchema.safeParse({ ...validPoll, description: 'Some description' })
    expect(result.success).toBe(true)
  })

  it('accepts null description', () => {
    const result = createPollSchema.safeParse({ ...validPoll, description: null })
    expect(result.success).toBe(true)
  })

  it('accepts optional deadline', () => {
    const result = createPollSchema.safeParse({ ...validPoll, deadline: '2025-12-31T23:59:59.000Z' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid deadline date string', () => {
    const result = createPollSchema.safeParse({ ...validPoll, deadline: 'not-a-date' })
    expect(result.success).toBe(false)
  })
})
