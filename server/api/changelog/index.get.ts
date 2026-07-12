import { db } from '~~/server/db'
import { changelogEntries } from '~~/server/db/schema/support'
import { user } from '~~/server/db/schema/auth'
import { eq, desc, count } from 'drizzle-orm'
import type { ChangelogEntry, ChangelogItem } from '~~/shared/types/changelog'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const query = getQuery(event)
  const page = Math.max(1, parseInt(query.page as string, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20))
  const offset = (page - 1) * limit

  // Get total count
  const [totalRow] = await db
    .select({ total: count() })
    .from(changelogEntries)
    .where(eq(changelogEntries.tenantId, session.tenantId))

  const total = totalRow?.total ?? 0

  // Get paginated results with author join
  const rows = await db
    .select({
      id: changelogEntries.id,
      version: changelogEntries.version,
      title: changelogEntries.title,
      changes: changelogEntries.changes,
      publishedAt: changelogEntries.publishedAt,
      createdById: changelogEntries.createdById,
      tenantId: changelogEntries.tenantId,
      createdAt: changelogEntries.createdAt,
      updatedAt: changelogEntries.updatedAt,
      createdByName: user.name,
    })
    .from(changelogEntries)
    .leftJoin(user, eq(changelogEntries.createdById, user.id))
    .where(eq(changelogEntries.tenantId, session.tenantId))
    .orderBy(desc(changelogEntries.publishedAt))
    .limit(limit)
    .offset(offset)

  const data: ChangelogEntry[] = rows.map((row) => ({
    id: row.id,
    version: row.version,
    title: row.title,
    changes: row.changes as ChangelogItem[],
    publishedAt: row.publishedAt.toISOString(),
    createdById: row.createdById,
    createdByName: row.createdByName ?? undefined,
    tenantId: row.tenantId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))

  return { data, meta: { total, page, limit } }
})
