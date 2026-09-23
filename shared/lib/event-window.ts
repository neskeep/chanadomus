/**
 * Ventanas operativas de eventos para vigilancia (check-in / check-out).
 *
 * Contexto (ticket 0b8f2a84): la expiracion perezosa pasa un evento a 'completado'
 * en cuanto vence `endsAt`, y la lista de vigilancia solo mostraba 'activo'. Los
 * invitados que seguian dentro quedaban sin salida registrada.
 *
 * Reglas:
 * - Un evento no terminado se muestra a vigilancia si se solapa con el dia local de hoy.
 * - Un evento terminado se sigue mostrando como "Finalizado":
 *     a) durante EVENT_LATE_CHECKIN_GRACE_MS tras el fin (se admite check-in tardio), o
 *     b) mientras queden invitados dentro, hasta EVENT_GUARD_CHECKOUT_WINDOW_MS tras el fin.
 * - Check-out: permitido en 'activo' y 'completado' sin limite de tiempo (el servidor ya
 *   lo aceptaba); la ventana (b) solo acota la visibilidad en la lista de vigilancia.
 * - Cierre automatico: al superar la ventana (b), los invitados que siguen 'dentro' pasan
 *   a 'salio' con checkedOutBy = null ("salida automatica") y hora max(endsAt, checkedInAt).
 *
 * Funciones puras (sin Nuxt/Nitro): se usan en server y client y se testean con vitest.
 */
import type { EventStatus, GuestStatus } from '../types/event'

const HOUR_MS = 60 * 60 * 1000

/** Tiempo tras el fin en que aun se admite check-in tardio (la fiesta se alarga). */
export const EVENT_LATE_CHECKIN_GRACE_MS = 2 * HOUR_MS

/** Tiempo tras el fin en que vigilancia sigue viendo un evento con invitados dentro. */
export const EVENT_GUARD_CHECKOUT_WINDOW_MS = 24 * HOUR_MS

export type EventGuardPhase = 'proximo' | 'en_curso' | 'finalizado'

interface EventTimes {
  startsAt: Date | string
  endsAt: Date | string
}

interface EventWindowInput extends EventTimes {
  status: EventStatus
}

interface GuardVisibilityInput extends EventWindowInput {
  guestsInside: number
}

function toMs(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

/** Estados en los que vigilancia puede operar un evento. */
export function isOperableStatus(status: EventStatus): boolean {
  return status === 'activo' || status === 'completado'
}

/** Fase del evento respecto a `now`, independiente del status guardado. */
export function eventGuardPhase(ev: EventTimes, now: Date = new Date()): EventGuardPhase {
  const t = now.getTime()
  if (toMs(ev.endsAt) <= t) return 'finalizado'
  if (toMs(ev.startsAt) > t) return 'proximo'
  return 'en_curso'
}

/** true si se puede registrar la entrada de un invitado. */
export function canCheckInEvent(ev: EventWindowInput, now: Date = new Date()): boolean {
  if (!isOperableStatus(ev.status)) return false
  const sinceEnd = now.getTime() - toMs(ev.endsAt)
  return sinceEnd <= EVENT_LATE_CHECKIN_GRACE_MS
}

/** true si se puede registrar la salida de un invitado que esta dentro. */
export function canCheckOutEvent(ev: Pick<EventWindowInput, 'status'>): boolean {
  return isOperableStatus(ev.status)
}

/**
 * true si el evento debe aparecer en la lista de vigilancia.
 * `today` es el rango UTC [start, end) del dia local del condominio.
 */
export function isVisibleToGuard(
  ev: GuardVisibilityInput,
  today: { start: Date; end: Date },
  now: Date = new Date(),
): boolean {
  if (!isOperableStatus(ev.status)) return false

  const endsAt = toMs(ev.endsAt)
  const sinceEnd = now.getTime() - endsAt

  if (sinceEnd < 0) {
    // No terminado: solo si se solapa con hoy (local)
    return toMs(ev.startsAt) < today.end.getTime() && endsAt >= today.start.getTime()
  }

  if (sinceEnd <= EVENT_LATE_CHECKIN_GRACE_MS) return true
  return ev.guestsInside > 0 && sinceEnd <= EVENT_GUARD_CHECKOUT_WINDOW_MS
}

/**
 * Limite inferior de `endsAt` para pre-filtrar en SQL los candidatos de vigilancia
 * (superconjunto de isVisibleToGuard; el filtro fino se hace en JS).
 */
export function guardCandidateMinEndsAt(today: { start: Date }, now: Date = new Date()): Date {
  const windowStart = now.getTime() - EVENT_GUARD_CHECKOUT_WINDOW_MS
  return new Date(Math.min(today.start.getTime(), windowStart))
}

/** true si el evento cuenta como "evento de hoy" para avisos (no terminado y en la lista). */
export function isUpcomingOrOngoing(ev: EventTimes, now: Date = new Date()): boolean {
  return eventGuardPhase(ev, now) !== 'finalizado'
}

/** Tiempo durante el que se puede deshacer una salida registrada por error. */
export const EVENT_CHECKOUT_UNDO_WINDOW_MS = 2 * 60 * 1000

interface UndoCheckoutInput {
  guestStatus: GuestStatus
  checkedOutAt: Date | string | null
  checkedOutBy: string | null
}

/**
 * true si `userId` puede revertir la salida de un invitado: la salida debe ser suya
 * (o ser admin) y de hace menos de EVENT_CHECKOUT_UNDO_WINDOW_MS.
 */
export function canUndoCheckout(
  guest: UndoCheckoutInput,
  actor: { userId: string; role: string },
  now: Date = new Date(),
): boolean {
  if (guest.guestStatus !== 'salio' || !guest.checkedOutAt) return false
  if (actor.role !== 'admin' && guest.checkedOutBy !== actor.userId) return false
  const elapsed = now.getTime() - toMs(guest.checkedOutAt)
  return elapsed >= 0 && elapsed <= EVENT_CHECKOUT_UNDO_WINDOW_MS
}

// ─── Cierre automatico de salidas ────────────────────────────────────────────

/**
 * Limite de `endsAt` para el cierre automatico: los eventos que terminaron antes de
 * este instante ya superaron EVENT_GUARD_CHECKOUT_WINDOW_MS.
 */
export function autoCheckoutCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - EVENT_GUARD_CHECKOUT_WINDOW_MS)
}

/** true si los invitados que siguen dentro de este evento deben salir automaticamente. */
export function shouldAutoCheckout(ev: Pick<EventTimes, 'endsAt'>, now: Date = new Date()): boolean {
  return toMs(ev.endsAt) < autoCheckoutCutoff(now).getTime()
}

/**
 * Hora que se registra en una salida automatica: el fin del evento, salvo que el
 * invitado entrara despues (check-in tardio), en cuyo caso su hora de entrada.
 */
export function autoCheckoutAt(endsAt: Date | string, checkedInAt: Date | string | null): Date {
  const end = toMs(endsAt)
  const entered = checkedInAt ? toMs(checkedInAt) : end
  return new Date(Math.max(end, entered))
}

interface CheckoutAuthorInput {
  checkedOutAt: string | Date | null
  checkedOutBy: string | null
}

/** Etiqueta para las salidas que cerro el sistema (sin usuario). */
export const AUTO_CHECKOUT_LABEL = 'Salida automática'

/** true si la salida la registro el sistema: hay hora de salida pero no usuario. */
export function isAutoCheckout(guest: CheckoutAuthorInput): boolean {
  return guest.checkedOutAt !== null && guest.checkedOutBy === null
}

/**
 * Texto de quien registro la salida: "Salida automática", "Salida: <nombre>" o null
 * si el invitado no ha salido (o no se conoce el nombre).
 */
export function checkoutAuthorLabel(guest: CheckoutAuthorInput & { checkedOutByName: string | null }): string | null {
  if (!guest.checkedOutAt) return null
  if (isAutoCheckout(guest)) return AUTO_CHECKOUT_LABEL
  return guest.checkedOutByName ? `Salida: ${guest.checkedOutByName}` : null
}
