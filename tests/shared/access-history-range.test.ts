import { describe, it, expect } from 'vitest'
import {
  UNIT_ACCESS_DEFAULT_RANGE,
  UNIT_ACCESS_RANGES,
  unitAccessRangeDates,
  unitAccessRangeDays,
} from '~~/shared/lib/access-history-range'
import { hasMorePages, pageOffset, paginationQuerySchema } from '~~/shared/lib/pagination'

describe('unitAccessRangeDates', () => {
  it('today cubre solo hoy', () => {
    expect(unitAccessRangeDates('today', '2026-09-23')).toEqual({ from: '2026-09-23', to: '2026-09-23' })
  })
  it('7d cubre hoy y los 6 días anteriores', () => {
    expect(unitAccessRangeDates('7d', '2026-09-23')).toEqual({ from: '2026-09-17', to: '2026-09-23' })
  })
  it('30d cruza meses', () => {
    expect(unitAccessRangeDates('30d', '2026-03-05')).toEqual({ from: '2026-02-04', to: '2026-03-05' })
  })
  it('días por rango y default', () => {
    expect(UNIT_ACCESS_RANGES.map(unitAccessRangeDays)).toEqual([1, 7, 30])
    expect(UNIT_ACCESS_DEFAULT_RANGE).toBe('today')
  })
})

describe('pagination', () => {
  const schema = paginationQuerySchema(20, 50)

  it('defaults y coerción desde query string', () => {
    expect(schema.parse({})).toEqual({ page: 1, limit: 20 })
    expect(schema.parse({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10 })
  })

  it('rechaza límites fuera de rango', () => {
    expect(schema.safeParse({ limit: '51' }).success).toBe(false)
    expect(schema.safeParse({ page: '0' }).success).toBe(false)
  })

  it('offset y hasMore', () => {
    expect(pageOffset(1, 20)).toBe(0)
    expect(pageOffset(3, 20)).toBe(40)
    expect(hasMorePages(1, 20, 20)).toBe(false)
    expect(hasMorePages(1, 20, 21)).toBe(true)
    expect(hasMorePages(2, 20, 41)).toBe(true)
    expect(hasMorePages(3, 20, 41)).toBe(false)
  })
})
