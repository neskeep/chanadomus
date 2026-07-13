import { auth } from '~~/server/lib/auth'
import type { H3Event } from 'h3'

export async function getServerSession(event: H3Event) {
  return auth.api.getSession({
    headers: event.headers,
  })
}

export async function requireAuth(event: H3Event) {
  const session = await getServerSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }
  return session
}

export async function requireRole(event: H3Event, roles: string[]) {
  const session = await requireAuth(event)
  if (!roles.includes(session.user.role ?? '')) {
    throw createError({ statusCode: 403, message: 'Sin permisos' })
  }
  return session
}

export async function requireTenant(event: H3Event) {
  const session = await requireAuth(event)
  const tenantId = (session.user as Record<string, unknown>).tenantId as string | undefined
  if (!tenantId) {
    throw createError({ statusCode: 403, message: 'Usuario sin tenant asignado' })
  }
  return { ...session, tenantId }
}

export async function requireSuperAdmin(event: H3Event) {
  const session = await requireTenant(event)
  const isSuperAdmin = (session.user as Record<string, unknown>).isSuperAdmin as boolean | undefined
  if (!isSuperAdmin) {
    throw createError({ statusCode: 403, message: 'Acceso restringido a super administrador' })
  }
  return session
}
