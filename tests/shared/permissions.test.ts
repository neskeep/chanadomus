import { describe, it, expect } from 'vitest'
import {
  adminRole,
  propietarioRole,
  conserjeRole,
  vigilanciaRole,
} from '~~/shared/lib/permissions'

const ALL_USER_PERMISSIONS = [
  'create',
  'read',
  'update',
  'delete',
  'ban',
  'impersonate',
  'set-role',
] as const

const WRITE_PERMISSIONS = ALL_USER_PERMISSIONS.filter((p) => p !== 'read')

describe('Permission matrix', () => {
  describe('adminRole', () => {
    it('has all user permissions', () => {
      for (const perm of ALL_USER_PERMISSIONS) {
        expect(adminRole.statements.user).toContain(perm)
      }
    })
  })

  describe('propietarioRole', () => {
    it('has read permission', () => {
      expect(propietarioRole.statements.user).toContain('read')
    })

    it('does NOT have create, update, delete, ban, impersonate, or set-role', () => {
      for (const perm of WRITE_PERMISSIONS) {
        expect(propietarioRole.statements.user).not.toContain(perm)
      }
    })
  })

  describe('conserjeRole', () => {
    it('has read permission', () => {
      expect(conserjeRole.statements.user).toContain('read')
    })

    it('does NOT have create, update, delete, ban, impersonate, or set-role', () => {
      for (const perm of WRITE_PERMISSIONS) {
        expect(conserjeRole.statements.user).not.toContain(perm)
      }
    })
  })

  describe('vigilanciaRole', () => {
    it('has read permission', () => {
      expect(vigilanciaRole.statements.user).toContain('read')
    })

    it('does NOT have create, update, delete, ban, impersonate, or set-role', () => {
      for (const perm of WRITE_PERMISSIONS) {
        expect(vigilanciaRole.statements.user).not.toContain(perm)
      }
    })
  })
})
