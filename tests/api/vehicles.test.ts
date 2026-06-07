import { describe, it, expect } from 'vitest'
import { apiJson } from './helpers'

describe('Vehicles API (propietario — my-unit)', () => {
  let vehicleId: string

  it('GET /api/my-unit/vehicles — lista vehiculos', async () => {
    const { status } = await apiJson('propietario', '/api/my-unit/vehicles')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/my-unit/vehicles — crea vehiculo', async () => {
    const { status, data } = await apiJson<{ data: { id: string } }>('propietario', '/api/my-unit/vehicles', {
      method: 'POST',
      body: JSON.stringify({
        plate: 'TEST-001',
        brand: 'Toyota',
        model: 'Corolla',
        color: 'Blanco',
      }),
    })
    expect(status).not.toBe(500)
    expect([200, 201]).toContain(status)
    vehicleId = data?.data?.id
  })

  it('PATCH /api/my-unit/vehicles/:id — edita vehiculo', async () => {
    if (!vehicleId) return
    const { status } = await apiJson('propietario', `/api/my-unit/vehicles/${vehicleId}`, {
      method: 'PATCH',
      body: JSON.stringify({ color: 'Negro' }),
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('POST /api/my-unit/vehicles/:id/pass — genera pase vehicular', async () => {
    if (!vehicleId) return
    const { status } = await apiJson('propietario', `/api/my-unit/vehicles/${vehicleId}/pass`, {
      method: 'POST',
      body: JSON.stringify({ passType: 'resident' }),
    })
    expect(status).not.toBe(500)
    expect([200, 201]).toContain(status)
  })

  it('DELETE /api/my-unit/vehicles/:id — elimina vehiculo CON pases (FK test)', async () => {
    if (!vehicleId) return
    const { status } = await apiJson('propietario', `/api/my-unit/vehicles/${vehicleId}`, {
      method: 'DELETE',
    })
    // THIS is the exact bug we fixed — should NOT be 500
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})

describe('Vehicles API (admin)', () => {
  let vehicleId: string

  it('GET /api/vehicles — admin lista vehiculos', async () => {
    const { status } = await apiJson('admin', '/api/vehicles')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  // Create a vehicle as propietario, then delete as admin
  it('admin DELETE con pases — FK cascade test', async () => {
    // Create vehicle
    const { data: createData } = await apiJson<{ data: { id: string } }>('propietario', '/api/my-unit/vehicles', {
      method: 'POST',
      body: JSON.stringify({ plate: 'ADM-001', brand: 'Ford', model: 'F150', color: 'Rojo' }),
    })
    vehicleId = createData?.data?.id
    if (!vehicleId) return

    // Create pass
    await apiJson('propietario', `/api/my-unit/vehicles/${vehicleId}/pass`, {
      method: 'POST',
      body: JSON.stringify({ passType: 'resident' }),
    })

    // Admin deletes vehicle with pass — must NOT 500
    const { status } = await apiJson('admin', `/api/vehicles/${vehicleId}`, {
      method: 'DELETE',
    })
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})
