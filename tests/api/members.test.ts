import { describe, it, expect } from 'vitest'
import { apiJson } from './helpers'

describe('Household Members API (propietario — my-unit)', () => {
  let memberId: string

  it('GET /api/my-unit/members — lista miembros', async () => {
    const { status } = await apiJson('propietario', '/api/my-unit/members')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/my-unit/members — crea miembro', async () => {
    const { status, data } = await apiJson<{ data: { id: string } }>('propietario', '/api/my-unit/members', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Member',
        relationship: 'spouse',
        idDocument: 'V-99887766',
        phone: '0414-1234567',
      }),
    })
    expect(status).not.toBe(500)
    expect([200, 201]).toContain(status)
    memberId = data?.data?.id
  })

  it('PATCH /api/my-unit/members/:id — edita miembro', async () => {
    if (!memberId) return
    const { status } = await apiJson('propietario', `/api/my-unit/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Member' }),
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/my-unit/members/:id/pass — genera pase miembro', async () => {
    if (!memberId) return
    const { status } = await apiJson('propietario', `/api/my-unit/members/${memberId}/pass`, {
      method: 'POST',
    })
    expect(status).not.toBe(500)
    expect([200, 201]).toContain(status)
  })

  it('DELETE /api/my-unit/members/:id/pass — desactiva pase', async () => {
    if (!memberId) return
    const { status } = await apiJson('propietario', `/api/my-unit/members/${memberId}/pass`, {
      method: 'DELETE',
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('DELETE /api/my-unit/members/:id — soft delete miembro', async () => {
    if (!memberId) return
    const { status } = await apiJson('propietario', `/api/my-unit/members/${memberId}`, {
      method: 'DELETE',
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})
