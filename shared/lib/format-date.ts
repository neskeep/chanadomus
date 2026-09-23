/**
 * Formateo de fechas y horas en la zona horaria del condominio (runtimeConfig.public.appTimezone),
 * independiente de la zona del navegador del usuario.
 *
 * Dos tipos de valor:
 * - Instantes (timestamps ISO con hora, `Date`): se muestran en la zona indicada.
 * - Fechas de calendario ("solo día"): `YYYY-MM-DD` o `YYYY-MM-DDT00:00:00(.000)Z` (así llegan
 *   las columnas `date` serializadas). Se formatean tal cual, sin desplazarse de día en ninguna zona.
 *
 * Funciones puras sin dependencias de Nuxt: se usan en client, server y tests.
 */

export const DEFAULT_DATE_LOCALE = 'es-VE'

// Fecha sola, o fecha a medianoche UTC exacta (serialización típica de una columna `date`).
const CALENDAR_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:$|T00:00:00(?:\.0+)?(?:Z|[+-]00:?00)?$)/

const formatterCache = new Map<string, Intl.DateTimeFormat>()

function getFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`
  let fmt = formatterCache.get(key)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, options)
    formatterCache.set(key, fmt)
  }
  return fmt
}

/** Si el valor es una fecha de calendario, devuelve el mediodía UTC de ese día (estable en cualquier zona). */
function calendarDateToUtcNoon(value: string): Date | null {
  const match = value.match(CALENDAR_DATE_RE)
  if (!match) return null
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12))
}

export function isCalendarDateString(value: string): boolean {
  return CALENDAR_DATE_RE.test(value)
}

/** Formatea un instante en la zona `timeZone`. */
export function formatInstantInZone(
  value: string | Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
  locale: string = DEFAULT_DATE_LOCALE,
): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return getFormatter(locale, { ...options, timeZone }).format(date)
}

/**
 * Formatea un valor como día de calendario.
 * - `YYYY-MM-DD` (o medianoche UTC): ese día exacto, sin desplazamiento.
 * - Cualquier otro instante: el día que corresponde en `timeZone`.
 */
export function formatCalendarDateInZone(
  value: string | Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
  locale: string = DEFAULT_DATE_LOCALE,
): string {
  if (typeof value === 'string') {
    const calendar = calendarDateToUtcNoon(value)
    if (calendar) return getFormatter(locale, { ...options, timeZone: 'UTC' }).format(calendar)
  }
  return formatInstantInZone(value, timeZone, options, locale)
}
