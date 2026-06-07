import { describe, it, expect } from 'vitest'
import { apiJson } from './helpers'

describe('Regulations API', () => {
  let regulationId: string

  it('GET /api/regulations — lista reglamentos', async () => {
    const { status } = await apiJson('admin', '/api/regulations')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  // NOTE: POST requires multipart with PDF attachment — test just validates it doesn't 500
  it('POST /api/regulations — sin attachment retorna 400 (no 500)', async () => {
    const { status } = await apiJson('admin', '/api/regulations', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Regulation',
      }),
    })
    expect(status).not.toBe(500)
    // 400 is expected because attachment is required
    expect(status).toBe(400)
  })
})
