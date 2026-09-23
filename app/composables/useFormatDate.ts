import { formatCalendarDateInZone, formatInstantInZone } from '~~/shared/lib/format-date'

const LOCALE = 'es-VE'

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}

const TIME_OPTIONS: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true }

const MONTH_YEAR_OPTIONS: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }

const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, {
  numeric: 'auto',
  style: 'long',
})

const RELATIVE_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: 'year', ms: 365.25 * 24 * 60 * 60 * 1000 },
  { unit: 'month', ms: 30.44 * 24 * 60 * 60 * 1000 },
  { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
]

/**
 * Un `Date` que llega a formatDate/formatMonthYear suele venir de un selector de calendario
 * (medianoche local del navegador): se toma su día local como fecha de calendario.
 */
function toCalendarValue(value: string | Date): string {
  if (typeof value === 'string') return value
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toDateTime(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value)
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Formateo de fechas de la app. Las horas se muestran siempre en la zona del condominio
 * (runtimeConfig.public.appTimezone), no en la del navegador.
 */
export function useFormatDate() {
  const timeZone = useRuntimeConfig().public.appTimezone

  /** Día de calendario. `YYYY-MM-DD` no se desplaza; un instante ISO se lleva al día del condominio. */
  const formatDate = (date: string | Date): string =>
    formatCalendarDateInZone(toCalendarValue(date), timeZone, DATE_OPTIONS, LOCALE)

  const formatDateTime = (date: string | Date): string =>
    formatInstantInZone(toDateTime(date), timeZone, DATE_TIME_OPTIONS, LOCALE)

  const formatTime = (date: string | Date): string =>
    formatInstantInZone(toDateTime(date), timeZone, TIME_OPTIONS, LOCALE)

  /** Instante con opciones Intl a medida, en la zona del condominio. */
  const formatInstant = (
    date: string | Date,
    options: Intl.DateTimeFormatOptions,
    locale: string = LOCALE,
  ): string => formatInstantInZone(toDateTime(date), timeZone, options, locale)

  /** Día de calendario con opciones Intl a medida (no se desplaza si es `YYYY-MM-DD`). */
  const formatCalendarDate = (
    date: string | Date,
    options: Intl.DateTimeFormatOptions,
    locale: string = LOCALE,
  ): string => formatCalendarDateInZone(toCalendarValue(date), timeZone, options, locale)

  const formatRelativeTime = (date: string | Date): string => {
    const diff = toDateTime(date).getTime() - Date.now()

    for (const { unit, ms } of RELATIVE_UNITS) {
      const value = Math.round(diff / ms)
      if (Math.abs(value) >= 1) {
        return relativeFormatter.format(value, unit)
      }
    }

    return relativeFormatter.format(0, 'second')
  }

  const formatCurrency = (amount: number, _currency: string = 'USD'): string => {
    const prefix = '$'
    const formatted = amount.toLocaleString(LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return `${prefix} ${formatted}`
  }

  const formatMonthYear = (date: string | Date): string =>
    capitalizeFirst(formatCalendarDateInZone(toCalendarValue(date), timeZone, MONTH_YEAR_OPTIONS, LOCALE))

  return {
    timeZone,
    formatDate,
    formatDateTime,
    formatTime,
    formatInstant,
    formatCalendarDate,
    formatRelativeTime,
    formatCurrency,
    formatMonthYear,
  }
}
