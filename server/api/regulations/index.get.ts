import { db } from '~~/server/db'
import { regulations } from '~~/server/db/schema/regulation'
import { user } from '~~/server/db/schema/auth'
import { eq, asc, desc } from 'drizzle-orm'
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
      displayOrder: regulations.displayOrder,
      publishedAt: regulations.publishedAt,
      createdAt: regulations.createdAt,
      updatedAt: regulations.updatedAt,
    })
    .from(regulations)
    .leftJoin(user, eq(regulations.authorId, user.id))
    .where(eq(regulations.tenantId, session.tenantId))
    .orderBy(asc(regulations.displayOrder), desc(regulations.publishedAt))

  const data: Regulation[] = rows.map(row => ({
    id: row.id,
    title: row.title,
    attachmentPath: row.attachmentPath,
    authorId: row.authorId,
    authorName: row.authorName ?? undefined,
    tenantId: row.tenantId,
    displayOrder: row.displayOrder,
    publishedAt: row.publishedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))

  return { data }
})
