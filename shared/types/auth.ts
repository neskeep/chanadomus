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
  '/propietario': ['admin', 'propietario'],
  '/conserje': ['admin', 'conserje'],
  '/vigilancia': ['admin', 'vigilancia'],
}

export const PUBLIC_ROUTES = ['/login', '/acceso']
