import { describe, it, expect } from 'vitest'
import {
  EVENT_CHECKOUT_UNDO_WINDOW_MS,
  EVENT_GUARD_CHECKOUT_WINDOW_MS,
  EVENT_LATE_CHECKIN_GRACE_MS,
  canCheckInEvent,
  canCheckOutEvent,
  canUndoCheckout,
  AUTO_CHECKOUT_LABEL,
  autoCheckoutAt,
  autoCheckoutCutoff,
  checkoutAuthorLabel,
  eventGuardPhase,
  guardCandidateMinEndsAt,
  isAutoCheckout,
  isUpcomingOrOngoing,
  isVisibleToGuard,
  shouldAutoCheckout,
} from '~~/shared/lib/event-window'
import { zonedDateRangeToUtc } from '~~/shared/lib/zoned-date'

const TZ = 'America/Caracas'
const HOUR = 60 * 60 * 1000
// Hoy = 2026-09-23 en Caracas → [04:00Z del 23, 04:00Z del 24)
const today = zonedDateRangeToUtc('2026-09-23', '2026-09-23', TZ)
// 2026-09-23 10:00 Caracas
const now = new Date('2026-09-23T14:00:00Z')

function ev(startsAt: string, endsAt: string, status: 'activo' | 'completado' | 'cancelado' | 'pendiente' = 'activo', guestsInside = 0) {
  return { startsAt, endsAt, status, guestsInside }
}

describe('eventGuardPhase', () => {
  it('distingue próximo, en curso y finalizado', () => {
    expect(eventGuardPhase(ev('2026-09-23T20:00:00Z', '2026-09-23T23:00:00Z'), now)).toBe('proximo')
    expect(eventGuardPhase(ev('2026-09-23T12:00:00Z', '2026-09-23T18:00:00Z'), now)).toBe('en_curso')
    expect(eventGuardPhase(ev('2026-09-23T08:00:00Z', '2026-09-23T14:00:00Z'), now)).toBe('finalizado')
  })

  it('isUpcomingOrOngoing excluye los terminados', () => {
    expect(isUpcomingOrOngoing(ev('2026-09-23T20:00:00Z', '2026-09-23T23:00:00Z'), now)).toBe(true)
    expect(isUpcomingOrOngoing(ev('2026-09-23T08:00:00Z', '2026-09-23T13:00:00Z'), now)).toBe(false)
  })
})

describe('isVisibleToGuard', () => {
  it('muestra un evento de hoy que aún no termina', () => {
    expect(isVisibleToGuard(ev('2026-09-23T20:00:00Z', '2026-09-24T02:00:00Z'), today, now)).toBe(true)
  })

  it('un evento de hoy a las 21:00 Caracas (01:00Z de mañana) cuenta como hoy', () => {
    expect(isVisibleToGuard(ev('2026-09-24T01:00:00Z', '2026-09-24T03:00:00Z'), today, now)).toBe(true)
  })

  it('no muestra un evento de mañana en hora local', () => {
    // 2026-09-24 00:30 Caracas
    expect(isVisibleToGuard(ev('2026-09-24T04:30:00Z', '2026-09-24T08:00:00Z'), today, now)).toBe(false)
  })

  it('ignora eventos pendientes y cancelados', () => {
    expect(isVisibleToGuard(ev('2026-09-23T12:00:00Z', '2026-09-23T18:00:00Z', 'pendiente'), today, now)).toBe(false)
    expect(isVisibleToGuard(ev('2026-09-23T12:00:00Z', '2026-09-23T18:00:00Z', 'cancelado', 5), today, now)).toBe(false)
  })

  it('mantiene un completado sin invitados dentro solo durante la gracia de check-in tardío', () => {
    const endedJustNow = ev('2026-09-23T08:00:00Z', new Date(now.getTime() - HOUR).toISOString(), 'completado', 0)
    expect(isVisibleToGuard(endedJustNow, today, now)).toBe(true)
    const endedLongAgo = ev('2026-09-23T04:00:00Z', new Date(now.getTime() - EVENT_LATE_CHECKIN_GRACE_MS - 1).toISOString(), 'completado', 0)
    expect(isVisibleToGuard(endedLongAgo, today, now)).toBe(false)
  })

  it('caso Aeropress: terminado ayer por la noche con invitados dentro sigue visible', () => {
    // fin 22/09 23:55 Caracas = 23/09 03:55Z; son las 10:00 del 23
    expect(isVisibleToGuard(ev('2026-09-22T22:00:00Z', '2026-09-23T03:55:00Z', 'completado', 44), today, now)).toBe(true)
  })

  it('deja de mostrarse 24 h después del fin aunque queden invitados dentro', () => {
    const end = new Date(now.getTime() - EVENT_GUARD_CHECKOUT_WINDOW_MS - 1).toISOString()
    expect(isVisibleToGuard(ev('2026-09-22T00:00:00Z', end, 'completado', 36), today, now)).toBe(false)
  })

  it('el pre-filtro SQL es un superconjunto de la regla', () => {
    const minEnd = guardCandidateMinEndsAt(today, now)
    expect(minEnd.getTime()).toBe(now.getTime() - EVENT_GUARD_CHECKOUT_WINDOW_MS)
    const earlyMorning = new Date('2026-09-23T05:00:00Z')
    expect(guardCandidateMinEndsAt(today, earlyMorning).getTime()).toBe(earlyMorning.getTime() - EVENT_GUARD_CHECKOUT_WINDOW_MS)
  })
})

describe('canCheckInEvent / canCheckOutEvent', () => {
  it('admite check-in en activo y hasta la gracia tras el fin', () => {
    const end = new Date(now.getTime() - EVENT_LATE_CHECKIN_GRACE_MS)
    expect(canCheckInEvent({ status: 'activo', endsAt: '2026-09-24T00:00:00Z', startsAt: '2026-09-23T00:00:00Z' }, now)).toBe(true)
    expect(canCheckInEvent({ status: 'completado', endsAt: end, startsAt: '2026-09-23T00:00:00Z' }, now)).toBe(true)
    expect(canCheckInEvent({ status: 'completado', endsAt: new Date(end.getTime() - 1), startsAt: '2026-09-23T00:00:00Z' }, now)).toBe(false)
  })

  it('no admite check-in en pendiente ni cancelado', () => {
    expect(canCheckInEvent({ status: 'pendiente', endsAt: '2026-09-24T00:00:00Z', startsAt: '2026-09-23T00:00:00Z' }, now)).toBe(false)
    expect(canCheckInEvent({ status: 'cancelado', endsAt: '2026-09-24T00:00:00Z', startsAt: '2026-09-23T00:00:00Z' }, now)).toBe(false)
  })

  it('check-out solo en activo o completado', () => {
    expect(canCheckOutEvent({ status: 'activo' })).toBe(true)
    expect(canCheckOutEvent({ status: 'completado' })).toBe(true)
    expect(canCheckOutEvent({ status: 'cancelado' })).toBe(false)
    expect(canCheckOutEvent({ status: 'pendiente' })).toBe(false)
  })
})

describe('canUndoCheckout', () => {
  const guard = { userId: 'u1', role: 'vigilancia' }
  const outAt = new Date(now.getTime() - 60_000)

  it('permite deshacer la salida propia dentro de la ventana', () => {
    expect(canUndoCheckout({ guestStatus: 'salio', checkedOutAt: outAt, checkedOutBy: 'u1' }, guard, now)).toBe(true)
  })

  it('rechaza la salida de otro guardia, salvo admin', () => {
    const g = { guestStatus: 'salio' as const, checkedOutAt: outAt, checkedOutBy: 'u2' }
    expect(canUndoCheckout(g, guard, now)).toBe(false)
    expect(canUndoCheckout(g, { userId: 'a1', role: 'admin' }, now)).toBe(true)
  })

  it('rechaza fuera de la ventana o si el invitado no salió', () => {
    const old = new Date(now.getTime() - EVENT_CHECKOUT_UNDO_WINDOW_MS - 1)
    expect(canUndoCheckout({ guestStatus: 'salio', checkedOutAt: old, checkedOutBy: 'u1' }, guard, now)).toBe(false)
    expect(canUndoCheckout({ guestStatus: 'dentro', checkedOutAt: null, checkedOutBy: null }, guard, now)).toBe(false)
  })
})

describe('cierre automático de salidas', () => {
  it('shouldAutoCheckout solo tras superar la ventana de 24 h', () => {
    const justInside = new Date(now.getTime() - EVENT_GUARD_CHECKOUT_WINDOW_MS)
    expect(shouldAutoCheckout({ endsAt: justInside }, now)).toBe(false)
    expect(shouldAutoCheckout({ endsAt: new Date(justInside.getTime() - 1) }, now)).toBe(true)
    expect(shouldAutoCheckout({ endsAt: '2026-09-24T00:00:00Z' }, now)).toBe(false)
  })

  it('caso Desayuno: terminó el 20/09 a las 17:00Z, se cierra el 23/09', () => {
    expect(shouldAutoCheckout({ endsAt: '2026-09-20T17:00:00Z' }, now)).toBe(true)
  })

  it('caso Aeropress: terminó hace unas 10 h, todavía no se cierra', () => {
    expect(shouldAutoCheckout({ endsAt: '2026-09-23T03:55:00Z' }, now)).toBe(false)
    expect(shouldAutoCheckout({ endsAt: '2026-09-23T03:55:00Z' }, new Date('2026-09-24T03:55:01Z'))).toBe(true)
  })

  it('autoCheckoutCutoff coincide con shouldAutoCheckout (pre-filtro SQL)', () => {
    const cutoff = autoCheckoutCutoff(now)
    expect(cutoff.getTime()).toBe(now.getTime() - EVENT_GUARD_CHECKOUT_WINDOW_MS)
    expect(shouldAutoCheckout({ endsAt: cutoff }, now)).toBe(false)
    expect(shouldAutoCheckout({ endsAt: new Date(cutoff.getTime() - 1) }, now)).toBe(true)
  })

  it('autoCheckoutAt usa el fin del evento, o la entrada si fue posterior', () => {
    const end = '2026-09-20T17:00:00Z'
    expect(autoCheckoutAt(end, '2026-09-20T15:00:00Z').toISOString()).toBe('2026-09-20T17:00:00.000Z')
    expect(autoCheckoutAt(end, '2026-09-20T18:30:00Z').toISOString()).toBe('2026-09-20T18:30:00.000Z')
    expect(autoCheckoutAt(new Date(end), null).toISOString()).toBe('2026-09-20T17:00:00.000Z')
  })

  it('una salida automática no se puede deshacer, ni siquiera un admin', () => {
    const g = { guestStatus: 'salio' as const, checkedOutAt: autoCheckoutAt('2026-09-20T17:00:00Z', null), checkedOutBy: null }
    expect(canUndoCheckout(g, { userId: 'a1', role: 'admin' }, now)).toBe(false)
  })
})

describe('checkoutAuthorLabel', () => {
  it('distingue salida automática, manual y sin salida', () => {
    const at = '2026-09-20T17:00:00Z'
    expect(isAutoCheckout({ checkedOutAt: at, checkedOutBy: null })).toBe(true)
    expect(isAutoCheckout({ checkedOutAt: null, checkedOutBy: null })).toBe(false)
    expect(checkoutAuthorLabel({ checkedOutAt: at, checkedOutBy: null, checkedOutByName: null })).toBe(AUTO_CHECKOUT_LABEL)
    expect(checkoutAuthorLabel({ checkedOutAt: at, checkedOutBy: 'u1', checkedOutByName: 'Pedro' })).toBe('Salida: Pedro')
    expect(checkoutAuthorLabel({ checkedOutAt: at, checkedOutBy: 'u1', checkedOutByName: null })).toBeNull()
    expect(checkoutAuthorLabel({ checkedOutAt: null, checkedOutBy: null, checkedOutByName: null })).toBeNull()
  })
})
