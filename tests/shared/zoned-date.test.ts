import { describe, it, expect } from 'vitest'
import {
  addDaysToDateString,
  diffDateStrings,
  getTimeZoneOffsetMs,
  isDateString,
  isValidTimeZone,
  lastZonedDays,
  zonedDateRangeToUtc,
  zonedDateString,
  zonedDayStart,
  zonedMonthStartString,
} from '~~/shared/lib/zoned-date'

const TZ = 'America/Caracas'

describe('zonedDateString (America/Caracas, UTC-4)', () => {
  it('19:59 Caracas sigue siendo el mismo día', () => {
    // 2026-09-22 19:59 Caracas = 2026-09-22 23:59 UTC
    expect(zonedDateString(new Date('2026-09-22T23:59:00Z'), TZ)).toBe('2026-09-22')
  })

  it('20:00 Caracas es el mismo día local aunque en UTC ya sea el siguiente', () => {
    // 2026-09-22 20:00 Caracas = 2026-09-23 00:00 UTC
    expect(zonedDateString(new Date('2026-09-23T00:00:00Z'), TZ)).toBe('2026-09-22')
  })

  it('23:59 Caracas pertenece al día local', () => {
    // 2026-09-22 23:59:59.999 Caracas = 2026-09-23 03:59:59.999 UTC
    expect(zonedDateString(new Date('2026-09-23T03:59:59.999Z'), TZ)).toBe('2026-09-22')
    // 2026-09-22 23:30 Caracas
    expect(zonedDateString(new Date('2026-09-23T03:30:00Z'), TZ)).toBe('2026-09-22')
  })

  it('00:00 Caracas empieza el nuevo día', () => {
    expect(zonedDateString(new Date('2026-09-23T04:00:00Z'), TZ)).toBe('2026-09-23')
    expect(zonedDateString(new Date('2026-09-23T04:30:00Z'), TZ)).toBe('2026-09-23')
  })

  it('en UTC no hay desplazamiento', () => {
    expect(zonedDateString(new Date('2026-09-23T00:00:00Z'), 'UTC')).toBe('2026-09-23')
  })
})

describe('zonedDayStart / zonedDateRangeToUtc', () => {
  it('medianoche de Caracas es 04:00 UTC', () => {
    expect(zonedDayStart('2026-09-23', TZ).toISOString()).toBe('2026-09-23T04:00:00.000Z')
  })

  it('rango de un día: [00:00, 24:00) Caracas', () => {
    const { start, end } = zonedDateRangeToUtc('2026-09-23', '2026-09-23', TZ)
    expect(start.toISOString()).toBe('2026-09-23T04:00:00.000Z')
    expect(end.toISOString()).toBe('2026-09-24T04:00:00.000Z')
  })

  it('bordes del filtro "hoy": 23:59 de ayer queda fuera, 00:30 de hoy dentro', () => {
    const { start, end } = zonedDateRangeToUtc('2026-09-23', '2026-09-23', TZ)
    const inRange = (iso: string) => {
      const t = new Date(iso).getTime()
      return t >= start.getTime() && t < end.getTime()
    }
    expect(inRange('2026-09-23T03:59:59.999Z')).toBe(false) // 22/09 23:59:59 Caracas
    expect(inRange('2026-09-23T03:30:00Z')).toBe(false) // 22/09 23:30 Caracas
    expect(inRange('2026-09-23T00:00:00Z')).toBe(false) // 22/09 20:00 Caracas
    expect(inRange('2026-09-23T04:00:00Z')).toBe(true) // 23/09 00:00 Caracas
    expect(inRange('2026-09-23T04:30:00Z')).toBe(true) // 23/09 00:30 Caracas
    expect(inRange('2026-09-23T23:59:00Z')).toBe(true) // 23/09 19:59 Caracas
    expect(inRange('2026-09-24T00:00:00Z')).toBe(true) // 23/09 20:00 Caracas
    expect(inRange('2026-09-24T03:59:59.999Z')).toBe(true) // 23/09 23:59:59.999 Caracas
    expect(inRange('2026-09-24T04:00:00Z')).toBe(false) // 24/09 00:00 Caracas
  })

  it('rango de varios días cruzando mes', () => {
    const { start, end } = zonedDateRangeToUtc('2026-08-30', '2026-09-02', TZ)
    expect(start.toISOString()).toBe('2026-08-30T04:00:00.000Z')
    expect(end.toISOString()).toBe('2026-09-03T04:00:00.000Z')
  })

  it('respeta DST en zonas que lo tienen (no usa offset fijo)', () => {
    // Nueva York: EDT (UTC-4) en julio, EST (UTC-5) en enero
    expect(zonedDayStart('2026-07-15', 'America/New_York').toISOString()).toBe('2026-07-15T04:00:00.000Z')
    expect(zonedDayStart('2026-01-15', 'America/New_York').toISOString()).toBe('2026-01-15T05:00:00.000Z')
    // Día del cambio de horario (8 de marzo de 2026): medianoche aún en EST
    expect(zonedDayStart('2026-03-08', 'America/New_York').toISOString()).toBe('2026-03-08T05:00:00.000Z')
    const { start, end } = zonedDateRangeToUtc('2026-03-08', '2026-03-08', 'America/New_York')
    expect(end.getTime() - start.getTime()).toBe(23 * 60 * 60 * 1000)
  })

  it('rechaza fechas inválidas', () => {
    expect(() => zonedDayStart('2026-02-30', TZ)).toThrow(RangeError)
    expect(() => zonedDayStart('23/09/2026', TZ)).toThrow(RangeError)
  })
})

describe('lastZonedDays', () => {
  it('a las 21:00 Caracas el último día es hoy local, no el día UTC', () => {
    // 2026-09-23 21:00 Caracas = 2026-09-24 01:00 UTC
    const days = lastZonedDays(7, TZ, new Date('2026-09-24T01:00:00Z'))
    expect(days).toEqual([
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
    ])
  })

  it('a las 10:00 Caracas incluye hoy como último día', () => {
    const days = lastZonedDays(7, TZ, new Date('2026-09-23T14:00:00Z'))
    expect(days).toHaveLength(7)
    expect(days.at(-1)).toBe('2026-09-23')
    expect(days[0]).toBe('2026-09-17')
  })
})

describe('utilidades de fecha', () => {
  it('addDaysToDateString cruza meses y años', () => {
    expect(addDaysToDateString('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysToDateString('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('diffDateStrings', () => {
    expect(diffDateStrings('2026-09-01', '2026-09-23')).toBe(22)
    expect(diffDateStrings('2026-06-25', '2026-09-23')).toBe(90)
  })

  it('isDateString / isValidTimeZone', () => {
    expect(isDateString('2026-09-23')).toBe(true)
    expect(isDateString('2026-13-01')).toBe(false)
    expect(isValidTimeZone(TZ)).toBe(true)
    expect(isValidTimeZone('Mars/Olympus')).toBe(false)
    expect(isValidTimeZone('')).toBe(false)
  })

  it('getTimeZoneOffsetMs de Caracas es -4h', () => {
    expect(getTimeZoneOffsetMs(new Date('2026-09-23T12:00:00Z'), TZ)).toBe(-4 * 60 * 60 * 1000)
  })

  it('zonedMonthStartString usa el mes local', () => {
    // 2026-09-30 21:00 Caracas = 2026-10-01 01:00 UTC → sigue siendo septiembre
    const now = new Date('2026-10-01T01:00:00Z')
    expect(zonedMonthStartString(TZ, 0, now)).toBe('2026-09-01')
    expect(zonedMonthStartString(TZ, 5, now)).toBe('2026-04-01')
    expect(zonedMonthStartString(TZ, 9, now)).toBe('2025-12-01')
  })
})
