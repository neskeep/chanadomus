import { describe, it, expect } from 'vitest'
import { apiJson } from './helpers'

describe('Panic API', () => {
  it('GET /api/panic/my-active — sin panico activo', async () => {
    const { status } = await apiJson('propietario', '/api/panic/my-active')
    expect(status).not.toBe(500)
    // 200 with null or 404 are both acceptable
    expect([200, 404]).toContain(status)
  })

  it('POST /api/panic — activa panico', async () => {
    const { status } = await apiJson('propietario', '/api/panic', {
      method: 'POST',
    })
    expect(status).not.toBe(500)
    expect([200, 201]).toContain(status)
  })

  it('DELETE /api/panic/my-active — desactiva panico', async () => {
    const { status } = await apiJson('propietario', '/api/panic/my-active', {
      method: 'DELETE',
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})
