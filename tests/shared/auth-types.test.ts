import { describe, it, expect } from 'vitest'
import {
  USER_ROLES,
  ROLE_REDIRECTS,
  ROLE_LABELS,
  ROUTE_ROLE_MAP,
  PUBLIC_ROUTES,
  HYBRID_ROUTES,
} from '~~/shared/types/auth'

describe('Auth types', () => {
  describe('ROLE_REDIRECTS', () => {
    it('every role in USER_ROLES has a corresponding redirect entry', () => {
      for (const role of USER_ROLES) {
        expect(ROLE_REDIRECTS).toHaveProperty(role)
        expect(typeof ROLE_REDIRECTS[role]).toBe('string')
      }
    })
  })

  describe('ROLE_LABELS', () => {
    it('every role in USER_ROLES has a corresponding label entry', () => {
      for (const role of USER_ROLES) {
        expect(ROLE_LABELS).toHaveProperty(role)
        expect(typeof ROLE_LABELS[role]).toBe('string')
        expect(ROLE_LABELS[role].length).toBeGreaterThan(0)
      }
    })
  })

  describe('ROUTE_ROLE_MAP', () => {
    it('admin has access to ALL route prefixes', () => {
      for (const [_route, roles] of Object.entries(ROUTE_ROLE_MAP)) {
        expect(roles).toContain('admin')
      }
    })

    it('propietario ONLY has access to /propietario', () => {
      for (const [route, roles] of Object.entries(ROUTE_ROLE_MAP)) {
        if (route === '/propietario') {
          expect(roles).toContain('propietario')
        } else {
          expect(roles).not.toContain('propietario')
        }
      }
    })

    it('conserje ONLY has access to /conserje', () => {
      for (const [route, roles] of Object.entries(ROUTE_ROLE_MAP)) {
        if (route === '/conserje') {
          expect(roles).toContain('conserje')
        } else {
          expect(roles).not.toContain('conserje')
        }
      }
    })

    it('vigilancia has access to /vigilancia and /accesos only', () => {
      const allowedRoutes = ['/vigilancia', '/accesos']
      for (const [route, roles] of Object.entries(ROUTE_ROLE_MAP)) {
        if (allowedRoutes.includes(route)) {
          expect(roles).toContain('vigilancia')
        } else {
          expect(roles).not.toContain('vigilancia')
        }
      }
    })
  })

  describe('PUBLIC_ROUTES and HYBRID_ROUTES', () => {
    it('do not overlap', () => {
      const overlap = PUBLIC_ROUTES.filter((r) => HYBRID_ROUTES.includes(r))
      expect(overlap).toHaveLength(0)
    })

    it('no role redirect points to a public route', () => {
      for (const role of USER_ROLES) {
        expect(PUBLIC_ROUTES).not.toContain(ROLE_REDIRECTS[role])
      }
    })
  })
})
