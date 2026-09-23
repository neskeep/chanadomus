import type { UserRole } from './auth'

/** Filtro de la lista de usuarios por estado de notificaciones push. */
export const PUSH_STATS_STATUSES = ['without', 'with', 'all'] as const
export type PushStatsStatus = (typeof PUSH_STATS_STATUSES)[number]

export interface PushStatsSummary {
  /** Usuarios elegibles: no baneados, sin superadmins ni cuentas de unidades demo */
  totalUsers: number
  /** Usuarios elegibles con al menos una suscripción (dispositivo) registrada */
  usersWithPush: number
  /** usersWithPush / totalUsers en %, con un decimal (0 si no hay usuarios) */
  percentage: number
  /** Suscripciones (dispositivos) de los usuarios elegibles */
  totalDevices: number
}

export interface PushStatsRoleRow {
  role: UserRole
  users: number
  withPush: number
  /** Usuarios con suscripción pero con la categoría "chat" desactivada */
  chatDisabled: number
  devices: number
}

export interface PushStats {
  summary: PushStatsSummary
  /** Siempre los 4 roles, en el orden de USER_ROLES (con ceros si no hay usuarios) */
  byRole: PushStatsRoleRow[]
}

export interface PushStatsUser {
  id: string
  name: string
  email: string
  role: UserRole
  unitNumber: string | null
  unitLabel: string | null
  /** Suscripciones registradas (0 = no recibe push en ningún dispositivo) */
  devices: number
  /** Fecha ISO de la suscripción más reciente, null si no tiene */
  lastSubscribedAt: string | null
  /** Preferencia de la categoría chat (true si el usuario nunca la tocó) */
  chatEnabled: boolean
}

export interface PushStatsUsersQuery {
  status?: PushStatsStatus
  role?: UserRole
  search?: string
  page?: number
  limit?: number
}
