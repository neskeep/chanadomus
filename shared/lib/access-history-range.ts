/**
 * Rangos del historial de accesos de la vivienda, en días de calendario del
 * condominio. Puro: el server convierte las fechas a UTC con tenant-time.
 */
import { addDaysToDateString } from './zoned-date'
import type { UnitAccessRange } from '../types/access'

export const UNIT_ACCESS_RANGES = ['today', '7d', '30d'] as const satisfies readonly UnitAccessRange[]
export const UNIT_ACCESS_DEFAULT_RANGE: UnitAccessRange = 'today'
export const UNIT_ACCESS_DEFAULT_LIMIT = 20
export const UNIT_ACCESS_MAX_LIMIT = 50

const RANGE_DAYS: Record<UnitAccessRange, number> = {
  today: 1,
  '7d': 7,
  '30d': 30,
}

/** Días de calendario que cubre el rango, contando hoy. */
export function unitAccessRangeDays(range: UnitAccessRange): number {
  return RANGE_DAYS[range]
}

/** Fechas locales inclusivas (YYYY-MM-DD) del rango, terminando en `today`. */
export function unitAccessRangeDates(range: UnitAccessRange, today: string): { from: string; to: string } {
  return { from: addDaysToDateString(today, -(RANGE_DAYS[range] - 1)), to: today }
}
