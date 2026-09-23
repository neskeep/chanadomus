/**
 * Fecha limite de votaciones en la zona del condominio (ticket 015d0634).
 *
 * El formulario envia solo la fecha (YYYY-MM-DD). Antes el servidor hacia
 * `new Date('YYYY-MM-DD')` = 00:00 UTC = 20:00 de Caracas del dia ANTERIOR, y la
 * votacion cerraba 28 horas antes de lo esperado. Ahora la fecha se interpreta
 * como "hasta el final de ese dia local" (23:59:59.999 en la zona del tenant).
 *
 * Para mostrar/editar la fecha en el cliente: useLocalDate().dateOf(deadline).
 * Funciones puras: se usan en server y client.
 */
import { addDaysToDateString, isDateString, zonedDayStart } from './zoned-date'

/** Instante UTC del ultimo milisegundo del dia local `ymd`. */
export function zonedDayEnd(ymd: string, timeZone: string): Date {
  return new Date(zonedDayStart(addDaysToDateString(ymd, 1), timeZone).getTime() - 1)
}

/**
 * Convierte la fecha limite recibida del cliente a instante UTC.
 * - 'YYYY-MM-DD' → final de ese dia local.
 * - ISO con hora → se respeta tal cual.
 * Devuelve null si el valor no es una fecha valida.
 */
export function parsePollDeadline(value: string, timeZone: string): Date | null {
  const trimmed = value.trim()
  if (isDateString(trimmed)) return zonedDayEnd(trimmed, timeZone)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null // formato de fecha pero dia imposible
  const d = new Date(trimmed)
  return Number.isNaN(d.getTime()) ? null : d
}

