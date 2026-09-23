import { sql, type AnyColumn, type SQL } from 'drizzle-orm'
import {
  isValidTimeZone,
  lastZonedDays,
  zonedDateRangeToUtc,
  zonedDateString,
  zonedMonthStartString,
  zonedDayStart,
  type UtcRange,
} from '~~/shared/lib/zoned-date'

/**
 * Hora "de calendario" del condominio.
 *
 * Las columnas `timestamp` (sin zona) guardan UTC naive. Para agrupar o filtrar por
 * día local hay que convertir primero a UTC y luego a la zona del tenant:
 *   ((col AT TIME ZONE 'UTC') AT TIME ZONE '<tz>')
 * Aplicar solo `col AT TIME ZONE '<tz>'` sobre un timestamp sin zona lo interpreta
 * como hora local y desplaza el resultado en sentido contrario (bug de v1.7).
 *
 * La zona viene de runtimeConfig.public.appTimezone (env NUXT_PUBLIC_APP_TIMEZONE).
 */

// Solo caracteres válidos en identificadores IANA: evita inyección al inlinear el literal.
const TZ_SAFE_RE = /^[A-Za-z0-9_+\-/]+$/

export function getAppTimezone(): string {
  const tz = useRuntimeConfig().public.appTimezone
  if (typeof tz !== 'string' || !TZ_SAFE_RE.test(tz) || !isValidTimeZone(tz)) {
    throw new Error(`Invalid runtimeConfig.public.appTimezone: "${String(tz)}"`)
  }
  return tz
}

/**
 * Literal SQL de la zona. Se inlinea (no como parámetro) para que la misma expresión
 * se pueda repetir en SELECT y GROUP BY sin que Postgres las vea distintas ($1 vs $2).
 */
function tzLiteral(tz: string): SQL {
  if (!TZ_SAFE_RE.test(tz) || !isValidTimeZone(tz)) {
    throw new Error(`Invalid time zone: "${tz}"`)
  }
  return sql.raw(`'${tz}'`)
}

/** Timestamp local (sin zona) de una columna timestamp que guarda UTC naive. */
export function localTimestampOf(column: AnyColumn | SQL, tz: string = getAppTimezone()): SQL<string> {
  return sql<string>`((${column} AT TIME ZONE 'UTC') AT TIME ZONE ${tzLiteral(tz)})`
}

/** Fecha local (::date) de una columna timestamp que guarda UTC naive. */
export function localDateOf(column: AnyColumn | SQL, tz: string = getAppTimezone()): SQL<string> {
  return sql<string>`(${localTimestampOf(column, tz)})::date`
}

/** Fecha local de hoy en SQL. */
export function localToday(tz: string = getAppTimezone()): SQL<string> {
  return sql<string>`(now() AT TIME ZONE ${tzLiteral(tz)})::date`
}

/** Hoy (YYYY-MM-DD) en la zona del condominio. */
export function localTodayString(now: Date = new Date(), tz: string = getAppTimezone()): string {
  return zonedDateString(now, tz)
}

/** Rango UTC [start, end) de las fechas locales `from`..`to` (inclusivas). */
export function localDateRangeToUtc(from: string, to: string, tz: string = getAppTimezone()): UtcRange {
  return zonedDateRangeToUtc(from, to, tz)
}

/** Rango UTC [start, end) del día local de hoy. */
export function localTodayRangeUtc(now: Date = new Date(), tz: string = getAppTimezone()): UtcRange & { day: string } {
  const day = zonedDateString(now, tz)
  return { day, ...zonedDateRangeToUtc(day, day, tz) }
}

/** Últimos `count` días locales (YYYY-MM-DD) terminando hoy, orden ascendente. */
export function lastLocalDays(count: number, now: Date = new Date(), tz: string = getAppTimezone()): string[] {
  return lastZonedDays(count, tz, now)
}

/** Instante UTC del inicio del mes local que está `monthsBack` meses antes del actual. */
export function localMonthStartUtc(monthsBack = 0, now: Date = new Date(), tz: string = getAppTimezone()): Date {
  return zonedDayStart(zonedMonthStartString(tz, monthsBack, now), tz)
}

/** YYYY-MM-01 del mes local que está `monthsBack` meses antes del actual. */
export function localMonthStartString(monthsBack = 0, now: Date = new Date(), tz: string = getAppTimezone()): string {
  return zonedMonthStartString(tz, monthsBack, now)
}
