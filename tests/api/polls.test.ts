import { describe, it, expect } from 'vitest'
import { apiJson } from './helpers'

describe('Polls API', () => {
  let createdId: string

  it('GET /api/polls — lista encuestas', async () => {
    const { status } = await apiJson('admin', '/api/polls')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/polls — crea encuesta', async () => {
    const { status, data } = await apiJson<{ data: { id: string } }>('admin', '/api/polls', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Poll',
        description: 'Encuesta de prueba',
        type: 'single',
        status: 'active',
        options: ['Opcion A', 'Opcion B', 'Opcion C'],
        deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
        displayOrder: 0,
      }),
    })
    expect(status).not.toBe(500)
    expect([200, 201]).toContain(status)
    createdId = data?.data?.id
  })

  it('GET /api/polls/:id/results — resultados', async () => {
    if (!createdId) return
    const { status } = await apiJson('admin', `/api/polls/${createdId}/results`)
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/polls/:id/vote — optionId invalido retorna 400 (no 500)', async () => {
    if (!createdId) return
    const { status } = await apiJson('propietario', `/api/polls/${createdId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId: 'not-a-valid-uuid' }),
    })
    // Must be 400, NEVER 500 — this was a real bug we fixed
    expect(status).not.toBe(500)
    expect(status).toBe(400)
  })

  it('DELETE /api/polls/:id — cierra y elimina encuesta (cascade options+votes)', async () => {
    if (!createdId) return

    // Must close poll before deleting — active polls can't be deleted
    const patchRes = await apiJson('admin', `/api/polls/${createdId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'closed' }),
    })
    expect(patchRes.status).not.toBe(500)

    const { status } = await apiJson('admin', `/api/polls/${createdId}`, {
      method: 'DELETE',
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})
