/**
 * Helpers de fecha "de calendario" en una zona horaria IANA (p. ej. America/Caracas).
 *
 * Contexto: las columnas `timestamp` (sin zona) guardan instantes UTC "naive".
 * Un día de calendario local (YYYY-MM-DD) corresponde a un rango UTC [inicio, fin)
 * que depende del offset de la zona. Estos helpers usan Intl (no offsets fijos),
 * así que soportan zonas con DST y cambios históricos de offset.
 *
 * Son funciones puras sin dependencias de Nuxt/Nitro: se usan en server y client.
 */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const DAY_MS = 24 * 60 * 60 * 1000

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>()

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = partsFormatterCache.get(timeZone)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    partsFormatterCache.set(timeZone, fmt)
  }
  return fmt
}

interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = getPartsFormatter(timeZone).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find(p => p.type === type)?.value ?? 0)
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function parseDateString(ymd: string): { year: number; month: number; day: number } {
  const match = DATE_RE.exec(ymd)
  if (!match) {
    throw new RangeError(`Invalid date string "${ymd}", expected YYYY-MM-DD`)
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const probe = new Date(Date.UTC(year, month - 1, day))
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    throw new RangeError(`Invalid calendar date "${ymd}"`)
  }
  return { year, month, day }
}

/** true si `timeZone` es un identificador IANA que Intl reconoce. */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  }
  catch {
    return false
  }
}

/** true si `value` es un YYYY-MM-DD de calendario válido. */
export function isDateString(value: string): boolean {
  try {
    parseDateString(value)
    return true
  }
  catch {
    return false
  }
}

/** Offset de la zona en ms (hora local - UTC) en el instante dado. Caracas: -4h. */
export function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const p = getZonedParts(date, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  const truncated = Math.floor(date.getTime() / 1000) * 1000
  return asUtc - truncated
}

/** Fecha de calendario (YYYY-MM-DD) del instante `date` en la zona dada. */
export function zonedDateString(date: Date, timeZone: string): string {
  const p = getZonedParts(date, timeZone)
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`
}

/** Suma (o resta) días a un YYYY-MM-DD, sin depender de zona horaria. */
export function addDaysToDateString(ymd: string, days: number): string {
  const { year, month, day } = parseDateString(ymd)
  const d = new Date(Date.UTC(year, month - 1, day) + days * DAY_MS)
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

/** Días de diferencia entre dos YYYY-MM-DD (to - from). */
export function diffDateStrings(from: string, to: string): number {
  const a = parseDateString(from)
  const b = parseDateString(to)
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / DAY_MS)
}

/** Instante UTC en que empieza (00:00 local) el día `ymd` en la zona dada. */
export function zonedDayStart(ymd: string, timeZone: string): Date {
  const { year, month, day } = parseDateString(ymd)
  const guess = Date.UTC(year, month - 1, day)
  const firstOffset = getTimeZoneOffsetMs(new Date(guess), timeZone)
  let instant = guess - firstOffset
  // Si el offset cambia entre la estimación y el resultado (DST), recalcular
  const secondOffset = getTimeZoneOffsetMs(new Date(instant), timeZone)
  if (secondOffset !== firstOffset) {
    instant = guess - secondOffset
  }
  return new Date(instant)
}

export interface UtcRange {
  /** Inclusivo */
  start: Date
  /** Exclusivo */
  end: Date
}

/**
 * Convierte un rango de fechas locales [from, to] (ambas inclusivas, YYYY-MM-DD)
 * a un rango de instantes UTC [start, end). Úsalo con `gte(col, start)` y `lt(col, end)`
 * para aprovechar índices sobre la columna.
 */
export function zonedDateRangeToUtc(from: string, to: string, timeZone: string): UtcRange {
  return {
    start: zonedDayStart(from, timeZone),
    end: zonedDayStart(addDaysToDateString(to, 1), timeZone),
  }
}

/** Los últimos `count` días locales terminando en el día de `now`, en orden ascendente. */
export function lastZonedDays(count: number, timeZone: string, now: Date = new Date()): string[] {
  const today = zonedDateString(now, timeZone)
  const days: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    days.push(addDaysToDateString(today, -i))
  }
  return days
}

/** Primer día (YYYY-MM-01) del mes local que está `monthsBack` meses antes del mes de `now`. */
export function zonedMonthStartString(timeZone: string, monthsBack = 0, now: Date = new Date()): string {
  const p = getZonedParts(now, timeZone)
  const d = new Date(Date.UTC(p.year, p.month - 1 - monthsBack, 1))
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-01`
}
