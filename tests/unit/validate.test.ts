import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// Mock Nitro auto-imports
const mockReadBody = vi.fn()
const mockGetQuery = vi.fn()
const mockGetRouterParams = vi.fn()
const mockCreateError = vi.fn((opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})

vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getQuery', mockGetQuery)
vi.stubGlobal('getRouterParams', mockGetRouterParams)
vi.stubGlobal('createError', mockCreateError)

// Import after mocking globals
const { validateBody, validateQuery, validateParams } = await import(
  '~~/server/utils/validate'
)

const testSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  email: z.string().email().optional(),
})

const paramsSchema = z.object({
  id: z.string().uuid(),
})

// Fake H3Event
const fakeEvent = {} as any

beforeEach(() => {
  vi.clearAllMocks()
})

describe('validateBody', () => {
  it('valid data returns parsed result', async () => {
    const input = { name: 'Test', amount: 100 }
    mockReadBody.mockResolvedValue(input)

    const result = await validateBody(fakeEvent, testSchema)
    expect(result).toEqual(input)
  })

  it('missing required field throws 400', async () => {
    mockReadBody.mockResolvedValue({ amount: 100 })

    await expect(validateBody(fakeEvent, testSchema)).rejects.toThrow()
    expect(mockCreateError).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    )
  })

  it('invalid type throws 400 with field path', async () => {
    mockReadBody.mockResolvedValue({ name: 'Test', amount: 'not-a-number' })

    await expect(validateBody(fakeEvent, testSchema)).rejects.toThrow()
    expect(mockCreateError).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    )
    const call = mockCreateError.mock.calls[0][0]
    expect(call.message).toContain('amount')
  })

  it('extra fields are stripped', async () => {
    mockReadBody.mockResolvedValue({ name: 'Test', amount: 50, extra: 'field' })

    const result = await validateBody(fakeEvent, testSchema)
    expect(result).not.toHaveProperty('extra')
    expect(result).toEqual({ name: 'Test', amount: 50 })
  })
})

describe('validateQuery', () => {
  it('valid query params work', () => {
    mockGetQuery.mockReturnValue({ name: 'Test', amount: 42 })
    const schema = z.object({ name: z.string(), amount: z.coerce.number() })

    const result = validateQuery(fakeEvent, schema)
    expect(result).toEqual({ name: 'Test', amount: 42 })
  })

  it('invalid params throw 400', () => {
    mockGetQuery.mockReturnValue({})

    expect(() => validateQuery(fakeEvent, testSchema)).toThrow()
    expect(mockCreateError).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    )
  })
})

describe('validateParams', () => {
  it('valid params work', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    mockGetRouterParams.mockReturnValue({ id: uuid })

    const result = validateParams(fakeEvent, paramsSchema)
    expect(result).toEqual({ id: uuid })
  })

  it('invalid params throw 400', () => {
    mockGetRouterParams.mockReturnValue({ id: 'not-a-uuid' })

    expect(() => validateParams(fakeEvent, paramsSchema)).toThrow()
    expect(mockCreateError).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    )
  })
})

describe('error message format', () => {
  it('includes field path and Zod message', async () => {
    mockReadBody.mockResolvedValue({ name: '', amount: -5 })

    await expect(validateBody(fakeEvent, testSchema)).rejects.toThrow()

    const call = mockCreateError.mock.calls[0][0]
    // formatZodError joins with "; " and each issue is "path: message"
    expect(call.message).toContain('name')
    expect(call.message).toContain('amount')
    expect(call.message).toContain('; ')
  })
})
