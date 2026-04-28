import { PUBLIC_ROUTES, ROLE_REDIRECTS, ROUTE_ROLE_MAP } from '~~/shared/types/auth'
import type { UserRole } from '~~/shared/types/auth'

interface SessionUser {
  user?: { role?: string }
}

export default defineNuxtRouteMiddleware(async (to) => {
  // Use useState to transfer session from SSR to client — avoids re-fetch during hydration
  const sessionState = useState<SessionUser | null>('auth-session', () => null)

  // On server: always fetch (with cookies)
  // On client: fetch only on navigation (not during hydration if we already have state)
  const nuxtApp = useNuxtApp()
  const isHydrating = import.meta.client && nuxtApp.isHydrating

  if (import.meta.server) {
    try {
      const event = useRequestEvent()
      const cookie = event?.headers.get('cookie') ?? ''
      sessionState.value = await $fetch<SessionUser>('/api/auth/get-session', {
        headers: { cookie },
      })
    } catch {
      sessionState.value = null
    }
  } else if (!isHydrating) {
    // Client-side navigation (not hydration) — re-check session
    try {
      sessionState.value = await $fetch<SessionUser>('/api/auth/get-session')
    } catch {
      sessionState.value = null
    }
  }

  const session = sessionState.value
  const isPublic = PUBLIC_ROUTES.some((route) => to.path === route || to.path.startsWith(route + '/'))

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
