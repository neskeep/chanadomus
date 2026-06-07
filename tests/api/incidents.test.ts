import { describe, it, expect } from 'vitest'
import { apiJson, apiFetch } from './helpers'

describe('Incidents API', () => {
  let incidentId: string

  it('GET /api/incidents — lista incidencias', async () => {
    const { status } = await apiJson('admin', '/api/incidents')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/incidents — crea incidencia (multipart)', async () => {
    const boundary = '----TestBoundary' + Date.now()
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="title"',
      '',
      'Test Incident',
      `--${boundary}`,
      'Content-Disposition: form-data; name="description"',
      '',
      'Incidencia de prueba',
      `--${boundary}`,
      'Content-Disposition: form-data; name="priority"',
      '',
      'medium',
      `--${boundary}--`,
    ].join('\r\n')

    const res = await apiFetch('propietario', '/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body,
    })
    expect(res.status).not.toBe(500)
    expect([200, 201]).toContain(res.status)
    const json = await res.json() as { data: { id: string } }
    incidentId = json?.data?.id
  })

  it('GET /api/incidents/:id — detalle incidencia', async () => {
    if (!incidentId) return
    const { status } = await apiJson('admin', `/api/incidents/${incidentId}`)
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('PATCH /api/incidents/:id/status — cambia estado', async () => {
    if (!incidentId) return
    const { status } = await apiJson('admin', `/api/incidents/${incidentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in_progress', comment: 'En revision' }),
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('DELETE /api/incidents/:id — elimina incidencia (cascade photos+updates)', async () => {
    if (!incidentId) return
    const { status } = await apiJson('admin', `/api/incidents/${incidentId}`, {
      method: 'DELETE',
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})
