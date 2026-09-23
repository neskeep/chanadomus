import { describe, it, expect } from 'vitest'
import {
  EXIT_ONLY_TOLERANCE_MS,
  OPEN_ENTRY_WINDOW_MS,
  OWNER_VIEW_OPEN_ENTRY_MAX_AGE_MS,
  SCAN_DEDUPE_WINDOW_MS,
  accessLogKind,
  evaluateScanDedupe,
  formatDuplicateScanMessage,
  isExitOnlyLog,
  lastActionOfLog,
  scanLockKey,
} from '~~/server/utils/access-scan-rules'

const T0 = new Date('2026-09-23T11:29:00.000Z') // 07:29 Caracas
const at = (ms: number) => new Date(T0.getTime() + ms)

describe('SCAN_DEDUPE_WINDOW_MS', () => {
  it('está entre 60 s y 5 min', () => {
    expect(SCAN_DEDUPE_WINDOW_MS).toBeGreaterThanOrEqual(60_000)
    expect(SCAN_DEDUPE_WINDOW_MS).toBeLessThanOrEqual(300_000)
  })
})

describe('lastActionOfLog', () => {
  it('entrada abierta: la acción es la entrada', () => {
    expect(lastActionOfLog(T0, null)).toEqual({ direction: 'entry', at: T0 })
  })

  it('entrada con salida: la acción es la salida', () => {
    const exit = at(10 * 60_000)
    expect(lastActionOfLog(T0, exit)).toEqual({ direction: 'exit', at: exit })
  })

  it('fila solo salida (exit = created): la acción es la salida', () => {
    expect(lastActionOfLog(T0, T0)).toEqual({ direction: 'exit', at: T0 })
  })

  it('exit_at anterior a created_at (dato corrupto): usa la entrada', () => {
    expect(lastActionOfLog(T0, at(-1000))).toEqual({ direction: 'entry', at: T0 })
  })
})

describe('evaluateScanDedupe', () => {
  it('sin acción previa no es duplicado', () => {
    expect(evaluateScanDedupe(null, T0)).toEqual({ duplicate: false })
  })

  it('re-escaneo a los 5 s de una entrada es duplicado', () => {
    const d = evaluateScanDedupe({ direction: 'entry', at: T0 }, at(5_000))
    expect(d).toMatchObject({ duplicate: true, direction: 'entry', secondsAgo: 5 })
    if (d.duplicate) expect(d.retryAfterSeconds).toBe(SCAN_DEDUPE_WINDOW_MS / 1000 - 5)
  })

  it('re-escaneo inmediato tras una salida es duplicado de la salida', () => {
    const d = evaluateScanDedupe({ direction: 'exit', at: T0 }, at(800))
    expect(d).toMatchObject({ duplicate: true, direction: 'exit', secondsAgo: 0 })
  })

  it('justo antes del límite sigue siendo duplicado', () => {
    const d = evaluateScanDedupe({ direction: 'entry', at: T0 }, at(SCAN_DEDUPE_WINDOW_MS - 1))
    expect(d.duplicate).toBe(true)
    if (d.duplicate) expect(d.retryAfterSeconds).toBe(1)
  })

  it('en el límite exacto y después ya no es duplicado', () => {
    expect(evaluateScanDedupe({ direction: 'entry', at: T0 }, at(SCAN_DEDUPE_WINDOW_MS)).duplicate).toBe(false)
    expect(evaluateScanDedupe({ direction: 'exit', at: T0 }, at(SCAN_DEDUPE_WINDOW_MS + 60_000)).duplicate).toBe(false)
  })

  it('una acción con reloj adelantado cuenta como recién hecha', () => {
    const d = evaluateScanDedupe({ direction: 'entry', at: at(3_000) }, T0)
    expect(d).toMatchObject({ duplicate: true, secondsAgo: 0 })
  })

  it('ventana configurable; 0 desactiva la dedupe', () => {
    expect(evaluateScanDedupe({ direction: 'entry', at: T0 }, at(15_000), 10_000).duplicate).toBe(false)
    expect(evaluateScanDedupe({ direction: 'entry', at: T0 }, at(5_000), 10_000).duplicate).toBe(true)
    expect(evaluateScanDedupe({ direction: 'entry', at: T0 }, T0, 0).duplicate).toBe(false)
  })

  // Casos reales del 23/09 (ticket 65f5a8b7)
  it('Anyelo R-013: entrada 07:29, salida 07:29 y entrada 07:29 → solo cuenta la primera', () => {
    const exitScan = evaluateScanDedupe({ direction: 'entry', at: T0 }, at(20_000))
    expect(exitScan.duplicate).toBe(true)
    const reentry = evaluateScanDedupe({ direction: 'entry', at: T0 }, at(40_000))
    expect(reentry.duplicate).toBe(true)
  })

  it('Sandra R-073: salida 07:54 y nuevo escaneo 08:15 → fuera de ventana, se procesa', () => {
    const exit = new Date('2026-09-23T11:54:00.000Z')
    const scan = new Date('2026-09-23T12:15:00.000Z')
    expect(evaluateScanDedupe({ direction: 'exit', at: exit }, scan).duplicate).toBe(false)
  })
})

describe('isExitOnlyLog / accessLogKind', () => {
  it('sin salida es entrada', () => {
    expect(isExitOnlyLog(T0, null)).toBe(false)
    expect(accessLogKind(T0, null)).toBe('entry')
  })

  it('exit_at = created_at es solo salida', () => {
    expect(isExitOnlyLog(T0, T0)).toBe(true)
    expect(accessLogKind(T0, T0)).toBe('exit_only')
  })

  it('filas antiguas con milisegundos de diferencia siguen siendo solo salida', () => {
    expect(isExitOnlyLog(T0, at(37))).toBe(true)
    expect(isExitOnlyLog(T0, at(EXIT_ONLY_TOLERANCE_MS))).toBe(true)
  })

  it('una salida pasada la tolerancia es una entrada real con salida', () => {
    expect(isExitOnlyLog(T0, at(EXIT_ONLY_TOLERANCE_MS + 1))).toBe(false)
    expect(accessLogKind(T0, at(101 * 60_000))).toBe('entry')
  })
})

describe('formatDuplicateScanMessage', () => {
  it('formatea entrada y salida', () => {
    expect(formatDuplicateScanMessage('entry', 12)).toBe('Entrada ya registrada hace 12 s')
    expect(formatDuplicateScanMessage('exit', 0)).toBe('Salida ya registrada hace 0 s')
  })

  it('redondea hacia abajo y no admite negativos', () => {
    expect(formatDuplicateScanMessage('entry', 7.9)).toBe('Entrada ya registrada hace 7 s')
    expect(formatDuplicateScanMessage('exit', -3)).toBe('Salida ya registrada hace 0 s')
  })
})

describe('scanLockKey', () => {
  it('separa por tenant y token', () => {
    expect(scanLockKey('t1', 'abc')).toBe('access-scan:t1:abc')
    expect(scanLockKey('t1', 'abc')).not.toBe(scanLockKey('t2', 'abc'))
  })
})

describe('OWNER_VIEW_OPEN_ENTRY_MAX_AGE_MS', () => {
  it('es 24 h y menor que la ventana de entradas abiertas del escáner', () => {
    expect(OWNER_VIEW_OPEN_ENTRY_MAX_AGE_MS).toBe(24 * 60 * 60 * 1000)
    expect(OWNER_VIEW_OPEN_ENTRY_MAX_AGE_MS).toBeLessThan(OPEN_ENTRY_WINDOW_MS)
  })
})
