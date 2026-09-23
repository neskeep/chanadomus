import { and, eq, sql, type SQL } from 'drizzle-orm'
import type { PgSelect } from 'drizzle-orm/pg-core'
import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { units } from '~~/server/db/schema/unit'
import { staff } from '~~/server/db/schema/staff'
import { pushSubscriptions } from '~~/server/db/schema/push'
import { pushPreferences } from '~~/server/db/schema/push-preferences'
import { PUSH_STATS_DEMO_UNIT_PATTERN } from '~~/shared/lib/push-stats'

/**
 * Bloques SQL compartidos por GET /api/admin/push-stats y /api/admin/push-stats/users.
 *
 * Criterio de "usuario elegible" (el mismo para resumen y lista):
 * - pertenece al tenant,
 * - no está baneado,
 * - no es superadmin (cuenta de plataforma, no de la comunidad),
 * - su unidad (propia o la del staff, para conserjes) no es demo:
 *   número o nombre contienen "demo" (ver PUSH_STATS_DEMO_UNIT_PATTERN).
 */

/** Rol efectivo del usuario (Better Auth usa "propietario" como default). */
export const pushStatsRoleExpr = sql<string>`coalesce(${user.role}, 'propietario')`

/**
 * Unidad del usuario: la suya o, si no tiene, la del registro de staff (conserjes).
 * Subconsulta con LIMIT 1 porque un usuario puede tener varias filas de staff.
 */
function resolvedUnitIdExpr(tenantId: string): SQL {
  return sql`coalesce(${user.unitId}, (
    select ${staff.unitId} from ${staff}
    where ${staff.userId} = ${user.id} and ${staff.tenantId} = ${tenantId}
    order by ${staff.isActive} desc
    limit 1
  ))`
}

/** Suscripciones agregadas por usuario (una fila por usuario con push). */
function subscriptionsByUser(tenantId: string) {
  return db
    .select({
      userId: pushSubscriptions.userId,
      devices: sql<number>`count(*)::int`.as('devices'),
      lastSubscribedAt: sql<Date>`max(${pushSubscriptions.createdAt})`.mapWith(pushSubscriptions.createdAt).as('last_subscribed_at'),
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.tenantId, tenantId))
    .groupBy(pushSubscriptions.userId)
    .as('subs')
}

/**
 * Joins y filtro de elegibilidad comunes. Uso:
 *   const base = pushStatsBase(tenantId)
 *   db.select({...}).from(user).$dynamic() |> base.join(...) |> .where(and(base.eligible, ...))
 */
export function pushStatsBase(tenantId: string) {
  const subs = subscriptionsByUser(tenantId)

  const eligible = and(
    eq(user.tenantId, tenantId),
    sql`coalesce(${user.banned}, false) = false`,
    sql`coalesce(${user.isSuperAdmin}, false) = false`,
    sql`not (coalesce(${units.number}, '') ilike ${PUSH_STATS_DEMO_UNIT_PATTERN}
      or coalesce(${units.label}, '') ilike ${PUSH_STATS_DEMO_UNIT_PATTERN})`,
  )!

  /** Aplica unidad resuelta, suscripciones agregadas y preferencias a un select dinámico sobre `user`. */
  function join<T extends PgSelect>(query: T) {
    return query
      .leftJoin(units, sql`${units.id} = ${resolvedUnitIdExpr(tenantId)}`)
      .leftJoin(subs, eq(subs.userId, user.id))
      .leftJoin(pushPreferences, and(eq(pushPreferences.userId, user.id), eq(pushPreferences.tenantId, tenantId)))
  }

  return { subs, eligible, join }
}
