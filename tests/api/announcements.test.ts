import { describe, it, expect } from 'vitest'
import { apiJson, apiFetch } from './helpers'

describe('Announcements API', () => {
  let createdId: string

  it('GET /api/announcements — lista anuncios', async () => {
    const { status } = await apiJson('admin', '/api/announcements')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/announcements — crea anuncio (multipart)', async () => {
    // This endpoint requires multipart form-data
    const boundary = '----TestBoundary' + Date.now()
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="title"',
      '',
      'Test Announcement',
      `--${boundary}`,
      'Content-Disposition: form-data; name="body"',
      '',
      'Contenido de prueba para test',
      `--${boundary}`,
      'Content-Disposition: form-data; name="category"',
      '',
      'general',
      `--${boundary}`,
      'Content-Disposition: form-data; name="status"',
      '',
      'published',
      `--${boundary}--`,
    ].join('\r\n')

    const res = await apiFetch('admin', '/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body,
    })
    expect(res.status).not.toBe(500)
    expect([200, 201]).toContain(res.status)
    const json = await res.json() as { data: { id: string } }
    createdId = json?.data?.id
    expect(createdId).toBeDefined()
  })

  it('GET /api/announcements/:id — detalle anuncio', async () => {
    if (!createdId) return
    const { status } = await apiJson('admin', `/api/announcements/${createdId}`)
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('PATCH /api/announcements/:id — edita anuncio', async () => {
    if (!createdId) return
    const { status } = await apiJson('admin', `/api/announcements/${createdId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Test Announcement' }),
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('DELETE /api/announcements/:id — elimina anuncio', async () => {
    if (!createdId) return
    const { status } = await apiJson('admin', `/api/announcements/${createdId}`, {
      method: 'DELETE',
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('GET /api/announcements — propietario puede listar', async () => {
    const { status } = await apiJson('propietario', '/api/announcements')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})
