import { PUBLIC_ROUTES, ROLE_REDIRECTS, ROUTE_ROLE_MAP } from '~~/shared/types/auth'
import type { UserRole } from '~~/shared/types/auth'

interface SessionUser {
  user?: { role?: string }
}

export default defineNuxtRouteMiddleware(async (to) => {
  let session: SessionUser | null = null

  try {
    if (import.meta.server) {
      const event = useRequestEvent()
      const cookie = event?.headers.get('cookie') ?? ''
      session = await $fetch<SessionUser>('/api/auth/get-session', {
        headers: { cookie },
      })
    } else {
      session = await $fetch<SessionUser>('/api/auth/get-session')
    }
  } catch {
    session = null
  }

  const isPublic = PUBLIC_ROUTES.includes(to.path)

  // Not authenticated -> redirect to login
  if (!session?.user) {
    if (!isPublic) {
      return navigateTo('/login')
    }
    return
  }

  // Authenticated user on public page -> redirect to role home
  if (isPublic) {
    const userRole = session.user.role as UserRole
    return navigateTo(ROLE_REDIRECTS[userRole] ?? '/admin')
  }

  // Check role-based route access
  for (const [prefix, allowedRoles] of Object.entries(ROUTE_ROLE_MAP)) {
    if (to.path.startsWith(prefix)) {
      const userRole = session.user.role as UserRole
      if (!allowedRoles.includes(userRole)) {
        return navigateTo(ROLE_REDIRECTS[userRole] ?? '/login')
      }
      break
    }
  }
})
