import { describe, expect, it } from 'vitest'
import { toQrUpdateInput } from '~/composables/useVisitPassForm'
import type { VisitPassFormValues } from '~/composables/useVisitPassForm'

const original = {
  visitorName: 'Ana Pérez',
  visitorDocument: 'V-123',
  expiresAt: '2026-09-24T03:59:59.000Z',
  multiUse: false,
}

function values(overrides: Partial<VisitPassFormValues> = {}): VisitPassFormValues {
  return {
    visitorName: 'Ana Pérez',
    visitorDocument: 'V-123',
    visitorType: 'invitado',
    expiresAt: null,
    multiUse: false,
    frequentVisitorId: null,
    saveAsFrequent: false,
    ...overrides,
  }
}

describe('toQrUpdateInput', () => {
  it('devuelve null si no hay cambios', () => {
    expect(toQrUpdateInput(values(), original)).toBeNull()
  })

  it('envía solo los campos de texto que cambiaron', () => {
    expect(toQrUpdateInput(values({ visitorName: 'Ana María Pérez' }), original))
      .toEqual({ visitorName: 'Ana María Pérez' })
    expect(toQrUpdateInput(values({ visitorDocument: 'V-999' }), original))
      .toEqual({ visitorDocument: 'V-999' })
  })

  it('mantener la vigencia no envía expiresAt ni multiUse', () => {
    expect(toQrUpdateInput(values({ multiUse: true }), original)).toBeNull()
  })

  it('una nueva vigencia envía expiresAt y multiUse solo si cambia', () => {
    const iso = '2026-09-30T03:59:59.000Z'
    expect(toQrUpdateInput(values({ expiresAt: iso, multiUse: false }), original))
      .toEqual({ expiresAt: iso })
    expect(toQrUpdateInput(values({ expiresAt: iso, multiUse: true }), original))
      .toEqual({ expiresAt: iso, multiUse: true })
  })

  it('ignora espacios del original al comparar', () => {
    expect(toQrUpdateInput(values(), { ...original, visitorName: ' Ana Pérez ' })).toBeNull()
  })
})
