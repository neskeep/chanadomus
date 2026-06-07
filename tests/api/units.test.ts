import { describe, it, expect } from 'vitest'
import { apiJson } from './helpers'

describe('Units API', () => {
  it('GET /api/units — lista unidades', async () => {
    const { status } = await apiJson('admin', '/api/units')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('GET /api/units/directory — directorio de unidades', async () => {
    const { status } = await apiJson('admin', '/api/units/directory')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})

describe('Staff API', () => {
  it('GET /api/staff/my-unit — conserje ve su unidad', async () => {
    const { status } = await apiJson('conserje', '/api/staff/my-unit')
    expect(status).not.toBe(500)
    // conserje role is correct, may return 200 or 404 if not assigned
    expect([200, 404]).toContain(status)
  })
})

describe('QR Codes API', () => {
  it('GET /api/qr/my-codes — mis codigos QR', async () => {
    const { status } = await apiJson('propietario', '/api/qr/my-codes')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  // QR generate requires unitId, visitorType, etc. — test validation
  it('POST /api/qr/generate — sin campos requeridos retorna 400 (no 500)', async () => {
    const { status } = await apiJson('propietario', '/api/qr/generate', {
      method: 'POST',
      body: JSON.stringify({ visitorName: 'QR Test Visitor' }),
    })
    expect(status).not.toBe(500)
    expect(status).toBe(400)
  })
})

describe('Resident Pass API', () => {
  it('GET /api/resident-pass/my-pass — mi pase residente', async () => {
    const { status } = await apiJson('propietario', '/api/resident-pass/my-pass')
    expect(status).not.toBe(500)
    // 200 or 404 if no pass exists yet
    expect([200, 404]).toContain(status)
  })
})

describe('Push Preferences API', () => {
  it('GET /api/me/push-preferences — preferencias push', async () => {
    const { status } = await apiJson('propietario', '/api/me/push-preferences')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})
