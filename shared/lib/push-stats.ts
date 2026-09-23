/**
 * Lógica pura de las estadísticas de notificaciones push (sirve en server y client).
 */
import { z } from 'zod'
import { paginationQuerySchema } from '~~/shared/lib/pagination'
import { USER_ROLES, type UserRole } from '~~/shared/types/auth'
import { PUSH_STATS_STATUSES, type PushStats, type PushStatsRoleRow } from '~~/shared/types/push-stats'

export const PUSH_STATS_USERS_DEFAULT_LIMIT = 20
export const PUSH_STATS_USERS_MAX_LIMIT = 100

/**
 * Patrón (ILIKE) que marca una unidad como demo por número o nombre.
 * Los usuarios de esas unidades no cuentan en las estadísticas.
 */
export const PUSH_STATS_DEMO_UNIT_PATTERN = '%demo%'

/** Códigos con los que el servicio de push indica que la suscripción ya no existe. */
export const EXPIRED_SUBSCRIPTION_STATUS_CODES: readonly number[] = [404, 410]

export function isExpiredSubscriptionStatus(statusCode: number | undefined): boolean {
  return statusCode !== undefined && EXPIRED_SUBSCRIPTION_STATUS_CODES.includes(statusCode)
}

/** Porcentaje con un decimal. 0 cuando no hay base. Acotado a [0, 100]. */
export function pushPercentage(part: number, total: number): number {
  if (total <= 0 || part <= 0) return 0
  const pct = Math.round((part / total) * 1000) / 10
  return Math.min(100, pct)
}

/** Fila agregada por rol tal como sale de SQL (el rol puede ser desconocido o null). */
export interface PushStatsRoleAggregate {
  role: string | null
  users: number
  withPush: number
  chatDisabled: number
  devices: number
}

function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value)
}

/**
 * Construye summary + byRole a partir de los agregados por rol.
 * - byRole siempre trae los 4 roles en el orden de USER_ROLES.
 * - Un rol null cuenta como "propietario" (default de Better Auth).
 * - Roles desconocidos entran en el summary pero no en byRole.
 */
export function buildPushStats(rows: PushStatsRoleAggregate[]): PushStats {
  const byRoleMap = new Map<UserRole, PushStatsRoleRow>(
    USER_ROLES.map(role => [role, { role, users: 0, withPush: 0, chatDisabled: 0, devices: 0 }]),
  )

  let totalUsers = 0
  let usersWithPush = 0
  let totalDevices = 0

  for (const row of rows) {
    const users = Number(row.users) || 0
    const withPush = Number(row.withPush) || 0
    const chatDisabled = Number(row.chatDisabled) || 0
    const devices = Number(row.devices) || 0

    totalUsers += users
    usersWithPush += withPush
    totalDevices += devices

    const role = row.role ?? 'propietario'
    if (!isUserRole(role)) continue
    const target = byRoleMap.get(role)!
    target.users += users
    target.withPush += withPush
    target.chatDisabled += chatDisabled
    target.devices += devices
  }

  return {
    summary: {
      totalUsers,
      usersWithPush,
      percentage: pushPercentage(usersWithPush, totalUsers),
      totalDevices,
    },
    byRole: USER_ROLES.map(role => byRoleMap.get(role)!),
  }
}

/** Query de GET /api/admin/push-stats/users */
export const pushStatsUsersQuerySchema = paginationQuerySchema(
  PUSH_STATS_USERS_DEFAULT_LIMIT,
  PUSH_STATS_USERS_MAX_LIMIT,
).extend({
  status: z.enum(PUSH_STATS_STATUSES, {
    error: 'status debe ser "without", "with" o "all"',
  }).default('without'),
  role: z.enum(USER_ROLES, {
    error: 'role debe ser admin, propietario, conserje o vigilancia',
  }).optional(),
  search: z.string().trim().max(100, 'search no puede superar 100 caracteres').optional(),
})

export type PushStatsUsersQueryParsed = z.infer<typeof pushStatsUsersQuerySchema>
