export const USER_ROLES = ['admin', 'propietario', 'conserje', 'vigilancia'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/admin',
  propietario: '/propietario',
  conserje: '/conserje',
  vigilancia: '/vigilancia',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  propietario: 'Propietario',
  conserje: 'Conserje',
  vigilancia: 'Vigilancia',
}

/** Route prefix -> roles allowed to access */
export const ROUTE_ROLE_MAP: Record<string, UserRole[]> = {
  '/admin': ['admin'],
  '/accesos': ['admin', 'vigilancia'],
  '/propietario': ['admin', 'propietario'],
  '/conserje': ['admin', 'conserje'],
  '/vigilancia': ['admin', 'vigilancia'],
}

/** Routes only for unauthenticated users (authenticated get redirected to role home) */
export const PUBLIC_ROUTES = ['/login']

/** Routes accessible regardless of auth state */
export const HYBRID_ROUTES = ['/acceso', '/invitacion', '/offline']

export interface UserWithUnit {
  id: string
  name: string
  email: string
  phone: string | null
  image: string | null
  role: UserRole
  banned: boolean
  banReason: string | null
  unitId: string | null
  unitNumber: string | null
  unitLabel: string | null
  createdAt: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: UserRole
  unitId?: string
  phone?: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  role?: UserRole
  unitId?: string | null
  phone?: string | null
}
