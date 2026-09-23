import { and, isNotNull, sql } from 'drizzle-orm'
import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { pushPreferences } from '~~/server/db/schema/push-preferences'
import { buildPushStats } from '~~/shared/lib/push-stats'
import type { PushStats } from '~~/shared/types/push-stats'

/**
 * GET /api/admin/push-stats
 * Resumen de adopción de notificaciones push del tenant: totales y desglose por rol.
 * Un solo GROUP BY sobre usuarios elegibles (criterio en server/utils/push-stats.ts).
 */
export default defineEventHandler(async (event): Promise<{ data: PushStats }> => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const base = pushStatsBase(tenantId)
  const hasPush = isNotNull(base.subs.userId)

  const rows = await base
    .join(
      db
        .select({
          role: pushStatsRoleExpr,
          users: sql<number>`count(*)::int`,
          withPush: sql<number>`count(*) filter (where ${hasPush})::int`,
          chatDisabled: sql<number>`count(*) filter (where ${and(hasPush, sql`${pushPreferences.chat} = false`)})::int`,
          devices: sql<number>`coalesce(sum(${base.subs.devices}), 0)::int`,
        })
        .from(user)
        .$dynamic(),
    )
    .where(base.eligible)
    .groupBy(pushStatsRoleExpr)

  return { data: buildPushStats(rows) }
})
