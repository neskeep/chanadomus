import { describe, it, expect } from 'vitest'
import { apiJson } from './helpers'

// We need a unitId to create finance records — get it from units list
let unitId: string

describe('Finance API', () => {
  let recordId: string

  it('setup: get unitId from units', async () => {
    const { data } = await apiJson<{ data: { id: string }[] }>('admin', '/api/units')
    unitId = data?.data?.[0]?.id
    expect(unitId).toBeDefined()
  })

  it('GET /api/finance/summary — resumen financiero', async () => {
    const { status } = await apiJson('admin', '/api/finance/summary')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('GET /api/finance/movements — movimientos', async () => {
    const { status } = await apiJson('admin', '/api/finance/movements')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/finance/records — crea registro financiero', async () => {
    if (!unitId) return
    const { status, data } = await apiJson<{ data: { id: string } }>('admin', '/api/finance/records', {
      method: 'POST',
      body: JSON.stringify({
        unitId,
        type: 'cargo',
        amount: 5000,
        description: 'Test payment',
        category: 'ordinaria',
        date: new Date().toISOString().split('T')[0],
      }),
    })
    expect(status).not.toBe(500)
    expect([200, 201]).toContain(status)
    recordId = data?.data?.id
  })

  it('GET /api/finance/records/:id — detalle registro', async () => {
    if (!recordId) return
    const { status } = await apiJson('admin', `/api/finance/records/${recordId}`)
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('PATCH /api/finance/records/:id — edita registro', async () => {
    if (!recordId) return
    const { status } = await apiJson('admin', `/api/finance/records/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify({ description: 'Updated payment' }),
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('DELETE /api/finance/records/:id — elimina registro', async () => {
    if (!recordId) return
    const { status } = await apiJson('admin', `/api/finance/records/${recordId}`, {
      method: 'DELETE',
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('GET /api/finance/my-account — propietario ve su cuenta', async () => {
    const { status } = await apiJson('propietario', '/api/finance/my-account')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})
