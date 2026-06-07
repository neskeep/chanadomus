import { describe, it, expect } from 'vitest'
import { apiJson } from './helpers'

describe('Frequent Visitors API', () => {
  let visitorId: string
  let unitId: string

  it('setup: get propietario unitId', async () => {
    const { data } = await apiJson<{ data: { unitId: string } }>('propietario', '/api/me/profile')
    unitId = data?.data?.unitId
    expect(unitId).toBeDefined()
  })

  it('GET /api/frequent-visitors — lista visitantes', async () => {
    const { status } = await apiJson('propietario', '/api/frequent-visitors')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/frequent-visitors — crea visitante frecuente', async () => {
    if (!unitId) return
    const { status, data } = await apiJson<{ data: { id: string } }>('propietario', '/api/frequent-visitors', {
      method: 'POST',
      body: JSON.stringify({
        visitorName: 'Test Visitor',
        visitorType: 'invitado',
        visitorDocument: 'V-11222333',
        unitId,
      }),
    })
    expect(status).not.toBe(500)
    expect([200, 201]).toContain(status)
    visitorId = data?.data?.id
  })

  it('PATCH /api/frequent-visitors/:id — edita visitante', async () => {
    if (!visitorId) return
    const { status } = await apiJson('propietario', `/api/frequent-visitors/${visitorId}`, {
      method: 'PATCH',
      body: JSON.stringify({ visitorName: 'Updated Visitor' }),
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('DELETE /api/frequent-visitors/:id — elimina visitante', async () => {
    if (!visitorId) return
    const { status } = await apiJson('propietario', `/api/frequent-visitors/${visitorId}`, {
      method: 'DELETE',
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})
