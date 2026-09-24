import { describe, it, expect } from 'vitest'
import {
  buildAutoCheckoutNotice,
  countClosedGuestsByEvent,
  pickAutoCheckoutRecipients,
} from '~~/shared/lib/event-auto-checkout-notice'

describe('countClosedGuestsByEvent', () => {
  it('agrupa las filas cerradas por evento', () => {
    const counts = countClosedGuestsByEvent([
      { eventId: 'a' },
      { eventId: 'b' },
      { eventId: 'a' },
      { eventId: 'a' },
    ])
    expect(counts.get('a')).toBe(3)
    expect(counts.get('b')).toBe(1)
    expect(counts.size).toBe(2)
  })

  it('sin filas no hay eventos que avisar (cierre paralelo que no cerró nada)', () => {
    expect(countClosedGuestsByEvent([]).size).toBe(0)
  })
})

describe('buildAutoCheckoutNotice', () => {
  it('usa plural con varios invitados', () => {
    const n = buildAutoCheckoutNotice({ eventId: 'ev-1', eventTitle: 'Cumpleaños de Ana', guestCount: 5 })
    expect(n.title).toBe('Salida registrada automáticamente')
    expect(n.body).toBe('Registramos la salida de 5 invitados de «Cumpleaños de Ana» que seguían dentro 24 horas después de terminar el evento.')
    expect(n.url).toBe('/propietario/eventos/ev-1')
    expect(n.tag).toBe('event-auto-checkout-ev-1')
  })

  it('usa singular con un invitado', () => {
    const n = buildAutoCheckoutNotice({ eventId: 'ev-2', eventTitle: 'Parrilla', guestCount: 1 })
    expect(n.body).toBe('Registramos la salida de 1 invitado de «Parrilla» que seguía dentro 24 horas después de terminar el evento.')
  })

  it('el cuerpo no usa rayas largas', () => {
    const n = buildAutoCheckoutNotice({ eventId: 'x', eventTitle: 'Fiesta', guestCount: 2 })
    expect(n.body).not.toMatch(/[—–]/)
  })
})

describe('pickAutoCheckoutRecipients', () => {
  const unitId = 'u-1'
  const owner = (id: string, extra: Partial<{ role: string, unitId: string, banned: boolean }> = {}) => ({
    id,
    role: extra.role ?? 'propietario',
    unitId: extra.unitId ?? unitId,
    banned: extra.banned ?? false,
  })

  it('si lo creó un propietario de la unidad, solo avisa al creador', () => {
    const r = pickAutoCheckoutRecipients({
      unitId,
      creator: owner('p-1'),
      unitOwners: [owner('p-1'), owner('p-2')],
    })
    expect(r).toEqual(['p-1'])
  })

  it('si lo creó conserje o admin, avisa a los propietarios de la unidad', () => {
    const r = pickAutoCheckoutRecipients({
      unitId,
      creator: owner('c-1', { role: 'conserje' }),
      unitOwners: [owner('p-1'), owner('p-2')],
    })
    expect(r).toEqual(['p-1', 'p-2'])

    const r2 = pickAutoCheckoutRecipients({
      unitId,
      creator: owner('a-1', { role: 'admin', unitId: 'otra' }),
      unitOwners: [owner('p-1')],
    })
    expect(r2).toEqual(['p-1'])
  })

  it('si el creador ya no es propietario activo de la unidad, cae en los propietarios de la unidad', () => {
    expect(pickAutoCheckoutRecipients({
      unitId,
      creator: owner('p-1', { banned: true }),
      unitOwners: [owner('p-1', { banned: true }), owner('p-2')],
    })).toEqual(['p-2'])

    expect(pickAutoCheckoutRecipients({
      unitId,
      creator: owner('p-9', { unitId: 'otra' }),
      unitOwners: [owner('p-2')],
    })).toEqual(['p-2'])
  })

  it('descarta bloqueados, otros roles, otras unidades y duplicados', () => {
    const r = pickAutoCheckoutRecipients({
      unitId,
      creator: null,
      unitOwners: [
        owner('p-1'),
        owner('p-1'),
        owner('p-2', { banned: true }),
        owner('p-3', { unitId: 'otra' }),
        owner('v-1', { role: 'vigilancia' }),
      ],
    })
    expect(r).toEqual(['p-1'])
  })

  it('sin propietarios en la unidad no hay destinatarios', () => {
    expect(pickAutoCheckoutRecipients({
      unitId,
      creator: owner('c-1', { role: 'conserje' }),
      unitOwners: [],
    })).toEqual([])
  })
})
