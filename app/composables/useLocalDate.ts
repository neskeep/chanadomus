import { addDaysToDateString, zonedDateString } from '~~/shared/lib/zoned-date'

/**
 * Fechas de calendario (YYYY-MM-DD) en la zona del condominio (runtimeConfig.public.appTimezone).
 * Usar en lugar de `new Date().toISOString().slice(0, 10)`, que da el día UTC
 * (a partir de las 20:00 en Caracas ya es "mañana").
 */
export function useLocalDate() {
  const timeZone = useRuntimeConfig().public.appTimezone

  function today(): string {
    return zonedDateString(new Date(), timeZone)
  }

  function daysAgo(days: number): string {
    return addDaysToDateString(today(), -days)
  }

  /** Fecha local (YYYY-MM-DD) de un instante ISO/Date, p. ej. la fecha límite de una votación. */
  function dateOf(value: string | Date): string {
    return zonedDateString(value instanceof Date ? value : new Date(value), timeZone)
  }

  return { timeZone, today, daysAgo, dateOf }
}
