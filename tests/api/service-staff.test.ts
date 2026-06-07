import { describe, it, expect } from 'vitest'
import { apiJson } from './helpers'

describe('Service Staff API (propietario — my-unit)', () => {
  let roleId: string
  let staffId: string
  const roleName = `Test Role ${Date.now()}`

  it('POST /api/admin/service-roles — crea rol de servicio', async () => {
    const { status, data } = await apiJson<{ data: { id: string } }>('admin', '/api/admin/service-roles', {
      method: 'POST',
      body: JSON.stringify({ name: roleName, description: 'Rol de prueba' }),
    })
    expect(status).not.toBe(500)
    expect([200, 201]).toContain(status)
    roleId = data?.data?.id
  })

  it('GET /api/admin/service-roles — lista roles', async () => {
    const { status } = await apiJson('admin', '/api/admin/service-roles')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('GET /api/my-unit/service-roles — propietario lista roles', async () => {
    const { status } = await apiJson('propietario', '/api/my-unit/service-roles')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/my-unit/service-staff — crea personal', async () => {
    if (!roleId) return
    const { status, data } = await apiJson<{ data: { id: string } }>('propietario', '/api/my-unit/service-staff', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Staff Member',
        roleId,
        idDocument: 'V-12345678',
        phone: '0414-9999999',
      }),
    })
    expect(status).not.toBe(500)
    expect([200, 201]).toContain(status)
    staffId = data?.data?.id
  })

  it('GET /api/my-unit/service-staff — lista personal', async () => {
    const { status } = await apiJson('propietario', '/api/my-unit/service-staff')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('PATCH /api/my-unit/service-staff/:id — edita personal', async () => {
    if (!staffId) return
    const { status } = await apiJson('propietario', `/api/my-unit/service-staff/${staffId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Staff' }),
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/my-unit/service-staff/:id/pass — genera pase', async () => {
    if (!staffId) return
    const { status } = await apiJson('propietario', `/api/my-unit/service-staff/${staffId}/pass`, {
      method: 'POST',
    })
    expect(status).not.toBe(500)
    expect([200, 201]).toContain(status)
  })

  it('DELETE /api/my-unit/service-staff/:id/pass — desactiva pase', async () => {
    if (!staffId) return
    const { status } = await apiJson('propietario', `/api/my-unit/service-staff/${staffId}/pass`, {
      method: 'DELETE',
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('DELETE /api/my-unit/service-staff/:id — soft delete personal', async () => {
    if (!staffId) return
    const { status } = await apiJson('propietario', `/api/my-unit/service-staff/${staffId}`, {
      method: 'DELETE',
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('DELETE /api/admin/service-roles/:id — no elimina rol en uso (409)', async () => {
    if (!roleId) return
    // Role still has soft-deleted staff referencing it — should return 409
    const { status } = await apiJson('admin', `/api/admin/service-roles/${roleId}`, {
      method: 'DELETE',
    })
    expect(status).not.toBe(500)
    expect(status).toBe(409)
  })
})
