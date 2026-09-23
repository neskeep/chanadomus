import { describe, it, expect } from 'vitest'
import { parsePollDeadline, zonedDayEnd } from '~~/shared/lib/poll-deadline'
import { zonedDateString } from '~~/shared/lib/zoned-date'

const TZ = 'America/Caracas'

describe('zonedDayEnd', () => {
  it('23:59:59.999 Caracas = 03:59:59.999Z del día siguiente', () => {
    expect(zonedDayEnd('2026-09-23', TZ).toISOString()).toBe('2026-09-24T03:59:59.999Z')
  })

  it('UTC termina a las 23:59:59.999Z del mismo día', () => {
    expect(zonedDayEnd('2026-09-23', 'UTC').toISOString()).toBe('2026-09-23T23:59:59.999Z')
  })

  it('respeta DST (Madrid en verano, UTC+2)', () => {
    expect(zonedDayEnd('2026-07-01', 'Europe/Madrid').toISOString()).toBe('2026-07-01T21:59:59.999Z')
  })
})

describe('parsePollDeadline', () => {
  it('una fecha sola cierra al final del día local, no a las 20:00 del día anterior', () => {
    const d = parsePollDeadline('2026-09-23', TZ)!
    expect(d.toISOString()).toBe('2026-09-24T03:59:59.999Z')
    // 23:30 Caracas del 23 todavía acepta votos
    expect(new Date('2026-09-24T03:30:00Z') <= d).toBe(true)
    // 00:00 Caracas del 24 ya no
    expect(new Date('2026-09-24T04:00:00Z') > d).toBe(true)
  })

  it('respeta un ISO con hora explícita', () => {
    expect(parsePollDeadline('2026-09-23T15:00:00Z', TZ)!.toISOString()).toBe('2026-09-23T15:00:00.000Z')
  })

  it('rechaza valores inválidos', () => {
    expect(parsePollDeadline('2026-02-30', TZ)).toBeNull()
    expect(parsePollDeadline('mañana', TZ)).toBeNull()
  })
})

describe('fecha local mostrada (zonedDateString, usado por useLocalDate().dateOf)', () => {
  it('devuelve el día local elegido, no el día UTC', () => {
    expect(zonedDateString(new Date('2026-09-24T03:59:59.999Z'), TZ)).toBe('2026-09-23')
  })

  it('ida y vuelta: fecha elegida → guardada → mostrada', () => {
    const stored = parsePollDeadline('2026-12-31', TZ)!
    expect(zonedDateString(stored, TZ)).toBe('2026-12-31')
  })
})
