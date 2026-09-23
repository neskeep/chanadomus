/**
 * Reglas puras de entrada/salida en access_logs (sin DB, testeables con vitest).
 * La parte con DB (lock, consultas) vive en access-entry-exit.ts y usa estas reglas.
 */
import type { AccessDirection } from '~~/shared/types/qr'
import type { AccessLogKind } from '~~/shared/types/access'

/**
 * Ventana anti doble escaneo: si el mismo pase/credencial ya tuvo una acción
 * permitida (entrada o salida) hace menos de esto, el nuevo escaneo se trata como
 * duplicado y no crea fila ni cambia estado. 90 s cubre el re-escaneo típico
 * (el guardia pulsa "Escanear otro" y el visitante sigue mostrando el QR) sin
 * bloquear una salida real, que en la práctica tarda varios minutos.
 */
export const SCAN_DEDUPE_WINDOW_MS = 90 * 1000

/**
 * Una entrada sin salida se considera "abierta" durante esta ventana: bloquea la
 * re-entrada (already_inside) y la cierra el siguiente escaneo de salida. Pasado
 * este plazo se marca expired_open. Admite estancias de varios días.
 */
export const OPEN_ENTRY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Vista del propietario ("Accesos registrados a tu vivienda"): una entrada sin
 * salida deja de mostrarse pasado este plazo, para que los registros abandonados
 * no queden arriba para siempre (ticket 65f5a8b7). El escáner sigue usando
 * OPEN_ENTRY_WINDOW_MS para bloquear re-entradas.
 */
export const OWNER_VIEW_OPEN_ENTRY_MAX_AGE_MS = 24 * 60 * 60 * 1000

/**
 * Una fila con exit_at a menos de esto de created_at se considera "solo salida":
 * se registró una salida sin entrada abierta. Las filas nuevas guardan
 * exit_at = created_at exacto; la tolerancia cubre las filas antiguas, donde
 * created_at venía de now() en la DB y exit_at del reloj de Node.
 */
export const EXIT_ONLY_TOLERANCE_MS = 60 * 1000

export function isExitOnlyLog(createdAt: Date, exitAt: Date | null): boolean {
  if (!exitAt) return false
  return exitAt.getTime() - createdAt.getTime() <= EXIT_ONLY_TOLERANCE_MS
}

export function accessLogKind(createdAt: Date, exitAt: Date | null): AccessLogKind {
  return isExitOnlyLog(createdAt, exitAt) ? 'exit_only' : 'entry'
}

export interface ScanAction {
  direction: AccessDirection
  at: Date
}

/** Última acción registrada en una fila: su salida si la tiene, si no su entrada. */
export function lastActionOfLog(createdAt: Date, exitAt: Date | null): ScanAction {
  if (exitAt && exitAt.getTime() >= createdAt.getTime()) {
    return { direction: 'exit', at: exitAt }
  }
  return { direction: 'entry', at: createdAt }
}

export type ScanDedupeDecision =
  | { duplicate: false }
  | {
      duplicate: true
      direction: AccessDirection
      at: Date
      /** Segundos transcurridos desde la acción previa (entero, >= 0) */
      secondsAgo: number
      /** Segundos que faltan para que un nuevo escaneo se acepte (entero, >= 1) */
      retryAfterSeconds: number
    }

/**
 * Decide si un escaneo es duplicado de la última acción registrada sobre el pase.
 * Un reloj algo desfasado (acción "en el futuro") cuenta como duplicado reciente.
 */
export function evaluateScanDedupe(
  lastAction: ScanAction | null,
  now: Date,
  windowMs: number = SCAN_DEDUPE_WINDOW_MS,
): ScanDedupeDecision {
  if (!lastAction || windowMs <= 0) return { duplicate: false }

  const elapsedMs = Math.max(0, now.getTime() - lastAction.at.getTime())
  if (elapsedMs >= windowMs) return { duplicate: false }

  return {
    duplicate: true,
    direction: lastAction.direction,
    at: lastAction.at,
    secondsAgo: Math.floor(elapsedMs / 1000),
    retryAfterSeconds: Math.max(1, Math.ceil((windowMs - elapsedMs) / 1000)),
  }
}

/** Mensaje para el guardia: "Entrada ya registrada hace 12 s". */
export function formatDuplicateScanMessage(direction: AccessDirection, secondsAgo: number): string {
  const label = direction === 'exit' ? 'Salida' : 'Entrada'
  return `${label} ya registrada hace ${Math.max(0, Math.floor(secondsAgo))} s`
}

/** Clave estable del lock de escaneo por tenant y credencial. */
export function scanLockKey(tenantId: string, token: string): string {
  return `access-scan:${tenantId}:${token}`
}
