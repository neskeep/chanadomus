import { authClient } from '~/lib/auth-client'
import { ROLE_REDIRECTS } from '~~/shared/types/auth'
import type { UserRole } from '~~/shared/types/auth'

export function useAuth() {
  const session = authClient.useSession()
  const router = useRouter()

  const user = computed(() => session.value?.data?.user ?? null)
  const isAuthenticated = computed(() => !!session.value?.data?.user)
  const role = computed(() => (user.value?.role as UserRole) ?? null)
  const isLoading = computed(() => session.value?.isPending ?? false)

  async function signIn(email: string, password: string) {
    const result = await authClient.signIn.email({ email, password })
    if (result.error) {
      throw new Error(result.error.message ?? 'Error al iniciar sesión')
    }
    const userRole = (result.data?.user as Record<string, unknown>)?.role as UserRole
    const redirect = ROLE_REDIRECTS[userRole] ?? '/login'
    await router.push(redirect)
    return result
  }

  async function signOut() {
    await authClient.signOut()
    await router.push('/login')
  }

  return {
    session,
    user,
    isAuthenticated,
    isLoading,
    role,
    signIn,
    signOut,
  }
}
