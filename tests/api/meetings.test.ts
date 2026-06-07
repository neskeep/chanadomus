import { describe, it, expect } from 'vitest'
import { apiJson } from './helpers'

describe('Meetings API', () => {
  let createdId: string

  it('GET /api/meetings — lista reuniones', async () => {
    const { status } = await apiJson('admin', '/api/meetings')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/meetings — crea reunion', async () => {
    const { status, data } = await apiJson<{ data: { id: string } }>('admin', '/api/meetings', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Meeting',
        description: 'Reunion de prueba',
        type: 'ordinaria',
        date: new Date(Date.now() + 86400000).toISOString(),
        location: 'Salon principal',
        displayOrder: 0,
      }),
    })
    expect(status).not.toBe(500)
    expect([200, 201]).toContain(status)
    createdId = data?.data?.id
  })

  it('GET /api/meetings/:id — detalle reunion', async () => {
    if (!createdId) return
    const { status } = await apiJson('admin', `/api/meetings/${createdId}`)
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('PATCH /api/meetings/:id — edita reunion', async () => {
    if (!createdId) return
    const { status } = await apiJson('admin', `/api/meetings/${createdId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Meeting' }),
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('DELETE /api/meetings/:id — elimina reunion', async () => {
    if (!createdId) return
    const { status } = await apiJson('admin', `/api/meetings/${createdId}`, {
      method: 'DELETE',
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})
