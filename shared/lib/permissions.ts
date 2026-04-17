import { createAccessControl } from 'better-auth/plugins/access'

/**
 * Resource permissions — expand as modules are added.
 * For v0.1.0, role-based route protection is the primary guard.
 */
const statement = {
  user: ['create', 'read', 'update', 'delete', 'ban', 'impersonate', 'set-role'],
} as const

export const ac = createAccessControl(statement)

export const adminRole = ac.newRole({
  user: ['create', 'read', 'update', 'delete', 'ban', 'impersonate', 'set-role'],
})

export const propietarioRole = ac.newRole({
  user: ['read'],
})

export const conserjeRole = ac.newRole({
  user: ['read'],
})

export const vigilanciaRole = ac.newRole({
  user: ['read'],
})
