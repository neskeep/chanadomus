import { describe, it, expect } from 'vitest'
import { apiJson } from './helpers'

/**
 * Tests that role-based access control works correctly.
 * Ensures endpoints reject unauthorized roles with 403, NOT 500.
 */
describe('Auth & Role Guards', () => {
  // Admin-only endpoints should reject propietario
  it('POST /api/admin/users — propietario gets 403, not 500', async () => {
    const { status } = await apiJson('propietario', '/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'Hack', email: 'hack@test.com' }),
    })
    expect(status).not.toBe(500)
    expect(status).toBe(403)
  })

  it('GET /api/admin/users — vigilancia gets 403, not 500', async () => {
    const { status } = await apiJson('vigilancia', '/api/admin/users')
    expect(status).not.toBe(500)
    expect(status).toBe(403)
  })

  // Unauthenticated requests should get 401
  it('GET /api/announcements — unauthenticated gets 401', async () => {
    const res = await fetch('http://localhost:3000/api/announcements')
    expect(res.status).not.toBe(500)
    expect(res.status).toBe(401)
  })

  // Each role can access their own profile
  it('GET /api/me/profile — admin', async () => {
    const { status } = await apiJson('admin', '/api/me/profile')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('GET /api/me/profile — propietario', async () => {
    const { status } = await apiJson('propietario', '/api/me/profile')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('GET /api/me/profile — vigilancia', async () => {
    const { status } = await apiJson('vigilancia', '/api/me/profile')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('GET /api/me/profile — conserje', async () => {
    const { status } = await apiJson('conserje', '/api/me/profile')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})

describe('Admin User Management', () => {
  it('GET /api/admin/users — admin lista usuarios', async () => {
    const { status } = await apiJson('admin', '/api/admin/users')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })

  it('GET /api/admin/invitations — lista invitaciones', async () => {
    const { status } = await apiJson('admin', '/api/admin/invitations')
    expect(status).not.toBe(500)
    expect(status).toBe(200)
  })
})
