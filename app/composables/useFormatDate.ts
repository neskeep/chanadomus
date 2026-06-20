const LOCALE = 'es-VE'

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const monthYearFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  year: 'numeric',
})

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

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value
  // Extraer componentes YYYY-MM-DD directamente para evitar shift de timezone
  // new Date("2026-06-01T00:00:00.000Z") en UTC-4 → May 31 (bug)
  // new Date(2026, 5, 1) → June 1 local (correcto)
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  return new Date(value)
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function useFormatDate() {
  const formatDate = (date: string | Date): string => {
    return dateFormatter.format(toDate(date))
  }

  const formatDateTime = (date: string | Date): string => {
    return dateTimeFormatter.format(toDate(date))
  }

  const formatTime = (date: string | Date): string => {
    return timeFormatter.format(toDate(date))
  }

  const formatRelativeTime = (date: string | Date): string => {
    const diff = toDate(date).getTime() - Date.now()

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

  const formatMonthYear = (date: string | Date): string => {
    return capitalizeFirst(monthYearFormatter.format(toDate(date)))
  }

  return {
    formatDate,
    formatDateTime,
    formatTime,
    formatRelativeTime,
    formatCurrency,
    formatMonthYear,
  }
}
