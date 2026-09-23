import { describe, it, expect } from 'vitest'
import {
  classifyQrStatus,
  qrCancelBlockReason,
  qrEditBlockReason,
  qrExpiresAtError,
  qrGenerateSchema,
  qrPassPermissions,
  qrUpdateSchema,
  type QrPassState,
} from '~~/shared/lib/qr-pass'

const NOW = new Date('2026-09-23T15:00:00.000Z') // 11:00 Caracas
const future = new Date(NOW.getTime() + 60 * 60 * 1000)
const past = new Date(NOW.getTime() - 60 * 60 * 1000)

function pass(overrides: Partial<QrPassState> = {}): QrPassState {
  return { expiresAt: future, usedAt: null, canceledAt: null, hasAccess: false, ...overrides }
}

describe('classifyQrStatus', () => {
  it('activo: vigente, sin uso ni cancelación', () => {
    expect(classifyQrStatus(pass(), NOW)).toBe('active')
  })

  it('multiuso con accesos y vigente sigue activo', () => {
    expect(classifyQrStatus(pass({ hasAccess: true }), NOW)).toBe('active')
  })

  it('usado: tiene usedAt (de un solo uso)', () => {
    expect(classifyQrStatus(pass({ usedAt: past, hasAccess: true }), NOW)).toBe('used')
  })

  it('usado: multiuso vencido con accesos y sin usedAt', () => {
    expect(classifyQrStatus(pass({ expiresAt: past, hasAccess: true }), NOW)).toBe('used')
  })

  it('expirado: vencido sin ningún acceso', () => {
    expect(classifyQrStatus(pass({ expiresAt: past }), NOW)).toBe('expired')
  })

  it('vence exactamente ahora cuenta como vencido', () => {
    expect(classifyQrStatus(pass({ expiresAt: NOW }), NOW)).toBe('expired')
  })

  it('cancelado tiene precedencia sobre usado y vencido', () => {
    expect(classifyQrStatus(pass({ canceledAt: past, usedAt: past, expiresAt: past, hasAccess: true }), NOW)).toBe('canceled')
  })
})

describe('qrEditBlockReason / canEdit', () => {
  it('se edita un pase activo nunca usado', () => {
    expect(qrEditBlockReason(pass(), NOW)).toBeNull()
    expect(qrPassPermissions(pass(), NOW).canEdit).toBe(true)
  })

  it('no se edita si tiene accesos aunque no tenga usedAt; sugiere cancelar', () => {
    expect(qrEditBlockReason(pass({ hasAccess: true }), NOW)).toBe('Este pase ya fue usado; solo puedes cancelarlo')
  })

  it('no se edita si tiene usedAt (y tampoco se puede cancelar)', () => {
    expect(qrEditBlockReason(pass({ usedAt: past }), NOW)).toBe('Este pase ya fue usado y no se puede editar')
  })

  it('no se edita un pase cancelado', () => {
    expect(qrEditBlockReason(pass({ canceledAt: past }), NOW)).toMatch(/cancelado/)
  })

  it('no se edita un pase vencido', () => {
    expect(qrEditBlockReason(pass({ expiresAt: past }), NOW)).toMatch(/venció/)
  })
})

describe('qrCancelBlockReason / canCancel', () => {
  it('se cancela un pase activo', () => {
    expect(qrCancelBlockReason(pass(), NOW)).toBeNull()
  })

  it('se cancela un multiuso vigente con accesos (sin usedAt)', () => {
    expect(qrPassPermissions(pass({ hasAccess: true }), NOW)).toEqual({ canEdit: false, canCancel: true })
  })

  it('no se cancela usado, vencido ni ya cancelado', () => {
    expect(qrCancelBlockReason(pass({ usedAt: past }), NOW)).not.toBeNull()
    expect(qrCancelBlockReason(pass({ expiresAt: past }), NOW)).not.toBeNull()
    expect(qrCancelBlockReason(pass({ canceledAt: past }), NOW)).not.toBeNull()
  })

  it('status activo implica canCancel; canEdit solo si no tuvo accesos', () => {
    const cases: QrPassState[] = [pass(), pass({ hasAccess: true })]
    for (const c of cases) {
      expect(classifyQrStatus(c, NOW)).toBe('active')
      expect(qrPassPermissions(c, NOW).canCancel).toBe(true)
      expect(qrPassPermissions(c, NOW).canEdit).toBe(!c.hasAccess)
    }
  })

  it('ningún pase no activo es editable ni cancelable', () => {
    const cases: QrPassState[] = [
      pass({ usedAt: past }),
      pass({ expiresAt: past }),
      pass({ expiresAt: past, hasAccess: true }),
      pass({ canceledAt: past }),
    ]
    for (const c of cases) {
      expect(classifyQrStatus(c, NOW)).not.toBe('active')
      expect(qrPassPermissions(c, NOW)).toEqual({ canEdit: false, canCancel: false })
    }
  })
})

describe('qrExpiresAtError', () => {
  it('acepta fechas futuras', () => {
    expect(qrExpiresAtError(future, NOW)).toBeNull()
  })
  it('rechaza pasadas, ahora e inválidas', () => {
    expect(qrExpiresAtError(past, NOW)).toBe('La fecha de vencimiento debe ser futura')
    expect(qrExpiresAtError(NOW, NOW)).toBe('La fecha de vencimiento debe ser futura')
    expect(qrExpiresAtError(new Date('x'), NOW)).toBe('La fecha de vencimiento no es válida')
  })
})

describe('qrGenerateSchema', () => {
  const valid = {
    visitorName: '  Ana Pérez ',
    visitorDocument: ' V-123 ',
    visitorType: 'invitado',
    unitId: '6f1b1a52-8d0c-4b8e-9d0e-2c1f7a1b2c3d',
    expiresAt: future.toISOString(),
  }

  it('acepta y recorta espacios', () => {
    const r = qrGenerateSchema.parse(valid)
    expect(r.visitorName).toBe('Ana Pérez')
    expect(r.visitorDocument).toBe('V-123')
  })

  it('exige cédula', () => {
    const r = qrGenerateSchema.safeParse({ ...valid, visitorDocument: '   ' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.message).toBe('La cédula del visitante es requerida')
  })

  it('frequentVisitorId vacío se ignora', () => {
    expect(qrGenerateSchema.parse({ ...valid, frequentVisitorId: '' }).frequentVisitorId).toBeUndefined()
  })

  it('rechaza tipo de visitante desconocido', () => {
    expect(qrGenerateSchema.safeParse({ ...valid, visitorType: 'otro' }).success).toBe(false)
  })
})

describe('qrUpdateSchema', () => {
  it('acepta un solo campo', () => {
    expect(qrUpdateSchema.parse({ visitorName: ' Luis ' })).toEqual({ visitorName: 'Luis' })
  })

  it('rechaza body vacío', () => {
    const r = qrUpdateSchema.safeParse({})
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.message).toBe('No hay cambios que guardar')
  })

  it('no permite vaciar el nombre ni la cédula', () => {
    expect(qrUpdateSchema.safeParse({ visitorName: '' }).success).toBe(false)
    expect(qrUpdateSchema.safeParse({ visitorDocument: ' ' }).success).toBe(false)
  })

  it('rechaza fecha inválida', () => {
    const r = qrUpdateSchema.safeParse({ expiresAt: 'mañana' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.message).toBe('La fecha de vencimiento no es válida')
  })

  it('ignora campos no editables (token, unitId)', () => {
    expect(qrUpdateSchema.parse({ visitorName: 'Luis', token: 'x', unitId: 'y' })).toEqual({ visitorName: 'Luis' })
  })
})
