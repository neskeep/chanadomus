import { describe, it, expect } from 'vitest'
import { apiJson } from './helpers'

describe('Access Logs API', () => {
  it('GET /api/access/logs — vigilancia lista accesos', async () => {
    const { status } = await apiJson('vigilancia', '/api/access/logs')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('GET /api/access/history — requiere from/to params', async () => {
    const today = new Date().toISOString().split('T')[0]
    const { status } = await apiJson('admin', `/api/access/history?from=${today}&to=${today}`)
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/access/manual — registro manual de acceso', async () => {
    const { status } = await apiJson('vigilancia', '/api/access/manual', {
      method: 'POST',
      body: JSON.stringify({
        visitorName: 'Manual Test Visitor',
        visitorDocument: 'V-99888777',
      }),
    })
    // Might need unitId, but should NOT be 500
    expect(status).not.toBe(500)
  })
})

describe('Dashboard API', () => {
  it('GET /api/dashboard/stats — estadisticas', async () => {
    const { status } = await apiJson('admin', '/api/dashboard/stats')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('GET /api/dashboard/trends — tendencias', async () => {
    const { status } = await apiJson('admin', '/api/dashboard/trends')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})
