/**
 * Utilidades de parsing de fechas para el módulo financiero.
 * Centralizan el manejo de timezone para evitar el shift de día
 * que ocurre cuando UTC midnight se interpreta en UTC-4 (Venezuela).
 */

/** Parsea un string YYYY-MM-DD a Date en noon local, evitando shift de timezone al cruzar límite de día */
export function parseFinanceDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`)
}

/** Parsea un filtro "desde" a inicio del día en UTC */
export function parseFilterFrom(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

/** Parsea un filtro "hasta" a fin del día en UTC */
export function parseFilterTo(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999Z`)
}
