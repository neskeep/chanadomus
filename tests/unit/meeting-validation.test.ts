import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schema mirrored from server/api/meetings/index.post.ts — must stay in sync
const createMeetingSchema = z.object({
  title: z.string().min(1, 'El titulo es requerido').max(200, 'El titulo no puede exceder 200 caracteres'),
  description: z.string().optional().nullable(),
  date: z.string().min(1, 'La fecha es requerida').refine((v) => !isNaN(new Date(v).getTime()), 'Fecha invalida'),
  endDate: z.string().refine((v) => !isNaN(new Date(v).getTime()), 'Fecha de fin invalida').optional().nullable(),
  location: z.string().optional().nullable(),
  meetingLink: z.string().optional().nullable(),
  type: z.enum(['ordinaria', 'extraordinaria', 'comite', 'informativa'], { message: 'El tipo de reunion es requerido y debe ser valido' }),
  agenda: z.string().optional().nullable(),
})

describe('Meeting - Create Meeting Schema', () => {
  const validMeeting = {
    title: 'Asamblea General Ordinaria',
    date: '2025-12-15T10:00:00.000Z',
    type: 'ordinaria' as const,
  }

  it('accepts a valid meeting', () => {
    const result = createMeetingSchema.safeParse(validMeeting)
    expect(result.success).toBe(true)
  })

  it('rejects missing title', () => {
    const { title, ...rest } = validMeeting
    const result = createMeetingSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects title over 200 chars', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, title: 'a'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('rejects missing date', () => {
    const { date, ...rest } = validMeeting
    const result = createMeetingSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects empty date', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, date: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid date string', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, date: 'not-a-date' })
    expect(result.success).toBe(false)
  })

  it('rejects missing type', () => {
    const { type, ...rest } = validMeeting
    const result = createMeetingSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects invalid type enum', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, type: 'urgente' })
    expect(result.success).toBe(false)
  })

  it('accepts type extraordinaria', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, type: 'extraordinaria' })
    expect(result.success).toBe(true)
  })

  it('accepts type comite', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, type: 'comite' })
    expect(result.success).toBe(true)
  })

  it('accepts type informativa', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, type: 'informativa' })
    expect(result.success).toBe(true)
  })

  it('accepts optional location', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, location: 'Salon de usos multiples' })
    expect(result.success).toBe(true)
  })

  it('accepts null location', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, location: null })
    expect(result.success).toBe(true)
  })

  it('accepts optional meetingLink', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, meetingLink: 'https://meet.google.com/abc-xyz' })
    expect(result.success).toBe(true)
  })

  it('accepts optional agenda', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, agenda: '1. Apertura\n2. Finanzas\n3. Cierre' })
    expect(result.success).toBe(true)
  })

  it('accepts optional description', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, description: 'Reunion mensual' })
    expect(result.success).toBe(true)
  })

  it('accepts optional endDate', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, endDate: '2025-12-15T12:00:00.000Z' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid endDate', () => {
    const result = createMeetingSchema.safeParse({ ...validMeeting, endDate: 'not-a-date' })
    expect(result.success).toBe(false)
  })
})
