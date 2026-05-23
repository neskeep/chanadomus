import { db } from '~~/server/db'
import { regulations } from '~~/server/db/schema/regulation'
import { user } from '~~/server/db/schema/auth'
import { eq, desc } from 'drizzle-orm'
import type { Regulation } from '~~/shared/types/regulation'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const rows = await db
    .select({
      id: regulations.id,
      title: regulations.title,
      attachmentPath: regulations.attachmentPath,
      authorId: regulations.authorId,
      authorName: user.name,
      tenantId: regulations.tenantId,
      publishedAt: regulations.publishedAt,
      createdAt: regulations.createdAt,
      updatedAt: regulations.updatedAt,
    })
    .from(regulations)
    .leftJoin(user, eq(regulations.authorId, user.id))
    .where(eq(regulations.tenantId, session.tenantId))
    .orderBy(desc(regulations.publishedAt))

  const data: Regulation[] = rows.map(row => ({
    id: row.id,
    title: row.title,
    attachmentPath: row.attachmentPath,
    authorId: row.authorId,
    authorName: row.authorName ?? undefined,
    tenantId: row.tenantId,
    publishedAt: row.publishedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))

  return { data }
})
