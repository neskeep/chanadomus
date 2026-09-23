import { and, asc, count, isNotNull, isNull, or, sql, type SQL } from 'drizzle-orm'
import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { units } from '~~/server/db/schema/unit'
import { pushPreferences } from '~~/server/db/schema/push-preferences'
import { hasMorePages, pageOffset } from '~~/shared/lib/pagination'
import { pushStatsUsersQuerySchema } from '~~/shared/lib/push-stats'
import type { UserRole } from '~~/shared/types/auth'
import type { Paginated } from '~~/shared/types/pagination'
import type { PushStatsUser } from '~~/shared/types/push-stats'

/**
 * GET /api/admin/push-stats/users?status=without&role=propietario&search=&page=1&limit=20
 * Usuarios elegibles con su estado de push. Por defecto, los que NO tienen
 * ninguna suscripción (a quién hay que pedirle que active las notificaciones).
 * Filtros, orden y paginación en SQL.
 */
export default defineEventHandler(async (event): Promise<Paginated<PushStatsUser>> => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  const { status, role, search, page, limit } = validateQuery(event, pushStatsUsersQuerySchema)

  const base = pushStatsBase(tenantId)

  const conditions: SQL[] = [base.eligible]
  if (status === 'with') conditions.push(isNotNull(base.subs.userId))
  if (status === 'without') conditions.push(isNull(base.subs.userId))
  if (role) conditions.push(sql`${pushStatsRoleExpr} = ${role}`)
  if (search) {
    const pattern = buildSearchPattern(search)
    conditions.push(or(
      searchContains(user.name, pattern),
      searchContains(user.email, pattern),
      searchContains(units.number, pattern),
      searchContains(units.label, pattern),
    )!)
  }
  const where = and(...conditions)

  const [rows, totals] = await Promise.all([
    base
      .join(
        db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            role: sql<UserRole>`${pushStatsRoleExpr}`,
            unitNumber: sql<string | null>`${units.number}`,
            unitLabel: sql<string | null>`${units.label}`,
            devices: sql<number>`coalesce(${base.subs.devices}, 0)::int`,
            lastSubscribedAt: base.subs.lastSubscribedAt,
            chatEnabled: sql<boolean>`coalesce(${pushPreferences.chat}, true)`,
          })
          .from(user)
          .$dynamic(),
      )
      .where(where)
      .orderBy(
        sql`CASE ${pushStatsRoleExpr}
          WHEN 'admin' THEN 0
          WHEN 'conserje' THEN 1
          WHEN 'vigilancia' THEN 2
          WHEN 'propietario' THEN 3
          ELSE 4
        END`,
        asc(user.name),
        asc(user.id),
      )
      .limit(limit)
      .offset(pageOffset(page, limit)),
    base
      .join(db.select({ total: count() }).from(user).$dynamic())
      .where(where),
  ])

  const total = totals[0]?.total ?? 0
  return {
    data: rows.map(row => ({
      ...row,
      lastSubscribedAt: row.lastSubscribedAt ? new Date(row.lastSubscribedAt).toISOString() : null,
    })),
    meta: { total, page, limit, hasMore: hasMorePages(page, limit, total) },
  }
})
