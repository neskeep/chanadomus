import { describe, it, expect } from 'vitest'
import { apiJson } from './helpers'

describe('Providers API', () => {
  let providerId: string

  it('GET /api/providers — lista proveedores', async () => {
    const { status } = await apiJson('admin', '/api/providers')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/providers/suggestions — sugiere proveedor', async () => {
    const { status, data } = await apiJson<{ data: { id: string } }>('propietario', '/api/providers/suggestions', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Provider',
        category: 'plomeria',
        phone: '0414-5555555',
      }),
    })
    expect(status).not.toBe(500)
    expect([200, 201]).toContain(status)
    providerId = data?.data?.id
  })

  it('PATCH /api/providers/:id — aprueba y edita proveedor', async () => {
    if (!providerId) return
    // Approve provider first (suggestions start as pending)
    const { status } = await apiJson('admin', `/api/providers/${providerId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Provider', status: 'active' }),
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/providers/:id/reviews — crea review (proveedor activo)', async () => {
    if (!providerId) return
    const { status } = await apiJson('propietario', `/api/providers/${providerId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: 4, comment: 'Buen servicio' }),
    })
    expect(status).not.toBe(500)
    expect([200, 201]).toContain(status)
  })

  it('DELETE /api/providers/:id — elimina proveedor (cascade reviews)', async () => {
    if (!providerId) return
    const { status } = await apiJson('admin', `/api/providers/${providerId}`, {
      method: 'DELETE',
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})
