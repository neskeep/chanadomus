/**
 * API Test Helpers
 *
 * Provides authenticated fetch for all 4 roles.
 * Uses Better Auth email/password sign-in to get real session cookies.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

const CREDENTIALS = {
  admin: { email: 'admin@chanadomus.com', password: 'Yolo2026!' },
  propietario: { email: 'propietario@chanadomus.com', password: 'Yolo2026!' },
  vigilancia: { email: 'vigilante@chanadomus.com', password: 'Yolo2026!' },
  conserje: { email: 'conserje@chanadomus.com', password: 'Yolo2026!' },
} as const

type Role = keyof typeof CREDENTIALS

// Cache sessions per role so we don't login on every request
const sessionCache = new Map<Role, string>()

/**
 * Sign in via Better Auth and return the session cookie header
 */
async function login(role: Role): Promise<string> {
  const cached = sessionCache.get(role)
  if (cached) return cached

  const creds = CREDENTIALS[role]
  const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': BASE_URL,
    },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
    redirect: 'manual',
  })

  if (!res.ok) {
    throw new Error(`Login failed for ${role}: ${res.status} ${await res.text()}`)
  }

  // Extract set-cookie headers
  const cookies = res.headers.getSetCookie?.() ?? []
  const cookieHeader = cookies
    .map(c => c.split(';')[0])
    .join('; ')

  if (!cookieHeader) {
    // Better Auth might return session in body
    const body = await res.json()
    if (body?.token) {
      const header = `better-auth.session_token=${body.token}`
      sessionCache.set(role, header)
      return header
    }
    throw new Error(`No session cookie returned for ${role}`)
  }

  sessionCache.set(role, cookieHeader)
  return cookieHeader
}

/**
 * Make an authenticated API request as a specific role
 */
export async function apiFetch(
  role: Role,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const cookie = await login(role)
  const url = `${BASE_URL}${path}`

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      ...options.headers,
    },
  })
}

/**
 * Make an authenticated API request and parse JSON response
 */
export async function apiJson<T = unknown>(
  role: Role,
  path: string,
  options: RequestInit = {},
): Promise<{ status: number; data: T }> {
  const res = await apiFetch(role, path, options)
  const text = await res.text()
  let data: T
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 200)}`)
  }
  return { status: res.status, data }
}

/**
 * Clear cached sessions (use in afterAll if needed)
 */
export function clearSessions() {
  sessionCache.clear()
}

export { BASE_URL, CREDENTIALS, type Role }
