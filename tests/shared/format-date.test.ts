import { describe, expect, it } from 'vitest'
import {
  formatCalendarDateInZone,
  formatInstantInZone,
  isCalendarDateString,
} from '~~/shared/lib/format-date'

const CARACAS = 'America/Caracas' // UTC-4, sin DST
const MADRID = 'Europe/Madrid'
const TIME: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
const DAY: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }

describe('formatInstantInZone', () => {
  it('muestra la hora del condominio, no la UTC', () => {
    // 14:30 UTC = 10:30 en Caracas
    expect(formatInstantInZone('2026-09-23T14:30:00.000Z', CARACAS, TIME)).toBe('10:30')
  })

  it('no depende de la zona del navegador: misma entrada, zonas distintas', () => {
    const iso = '2026-09-23T14:30:00.000Z'
    expect(formatInstantInZone(iso, CARACAS, TIME)).toBe('10:30')
    expect(formatInstantInZone(iso, MADRID, TIME)).toBe('16:30')
  })

  it('cambia de día según la zona (22:00 del 22 en Caracas = 02:00 UTC del 23)', () => {
    const iso = '2026-09-23T02:00:00.000Z'
    expect(formatInstantInZone(iso, CARACAS, DAY, 'en-CA')).toBe('2026-09-22')
    expect(formatInstantInZone(iso, 'UTC', DAY, 'en-CA')).toBe('2026-09-23')
  })

  it('acepta objetos Date', () => {
    expect(formatInstantInZone(new Date('2026-01-05T12:00:00Z'), CARACAS, TIME)).toBe('08:00')
  })

  it('devuelve cadena vacía con una fecha inválida', () => {
    expect(formatInstantInZone('no-es-fecha', CARACAS, TIME)).toBe('')
  })

  it('usa es-VE por defecto', () => {
    const out = formatInstantInZone('2026-09-23T14:30:00Z', CARACAS, { day: 'numeric', month: 'short', year: 'numeric' })
    expect(out).toMatch(/23/)
    expect(out.toLowerCase()).toMatch(/sept?/)
  })
})

describe('formatCalendarDateInZone', () => {
  it('no desplaza una fecha YYYY-MM-DD en zonas al oeste de UTC', () => {
    expect(formatCalendarDateInZone('2026-06-01', CARACAS, DAY, 'en-CA')).toBe('2026-06-01')
  })

  it('no desplaza una fecha YYYY-MM-DD en zonas al este de UTC', () => {
    expect(formatCalendarDateInZone('2026-06-01', 'Asia/Tokyo', DAY, 'en-CA')).toBe('2026-06-01')
    expect(formatCalendarDateInZone('2026-06-01', 'Pacific/Kiritimati', DAY, 'en-CA')).toBe('2026-06-01')
  })

  it('trata medianoche UTC exacta como fecha de calendario (columna date serializada)', () => {
    expect(formatCalendarDateInZone('2026-06-01T00:00:00.000Z', CARACAS, DAY, 'en-CA')).toBe('2026-06-01')
    expect(formatCalendarDateInZone('2026-06-01T00:00:00Z', CARACAS, DAY, 'en-CA')).toBe('2026-06-01')
  })

  it('un instante con hora se lleva al día del condominio', () => {
    // 01:30 UTC del 2 de junio = 21:30 del 1 de junio en Caracas
    expect(formatCalendarDateInZone('2026-06-02T01:30:00.000Z', CARACAS, DAY, 'en-CA')).toBe('2026-06-01')
  })
})

describe('isCalendarDateString', () => {
  it('reconoce fechas de calendario', () => {
    expect(isCalendarDateString('2026-06-01')).toBe(true)
    expect(isCalendarDateString('2026-06-01T00:00:00.000Z')).toBe(true)
  })

  it('rechaza instantes con hora', () => {
    expect(isCalendarDateString('2026-06-01T10:00:00.000Z')).toBe(false)
    expect(isCalendarDateString('2026-06-01T00:00:01Z')).toBe(false)
  })
})
