import { db } from '~~/server/db'
import { changelogEntries } from '~~/server/db/schema/support'
import { user } from '~~/server/db/schema/auth'
import { eq, and } from 'drizzle-orm'
import type { ChangelogEntry, ChangelogItem } from '~~/shared/types/changelog'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de entrada requerido' })
  }

  const [row] = await db
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
    .where(and(
      eq(changelogEntries.id, id),
      eq(changelogEntries.tenantId, session.tenantId),
    ))

  if (!row) {
    throw createError({ statusCode: 404, message: 'Entrada de changelog no encontrada' })
  }

  const data: ChangelogEntry = {
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
  }

  return { data }
})
