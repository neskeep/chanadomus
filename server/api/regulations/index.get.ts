import { db } from '~~/server/db'
import { regulations } from '~~/server/db/schema/regulation'
import { user } from '~~/server/db/schema/auth'
import { eq, desc, and } from 'drizzle-orm'
import type { Regulation, RegulationCategory } from '~~/shared/types/regulation'

const VALID_CATEGORIES: RegulationCategory[] = ['normas', 'horarios', 'arquitectura']

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const query = getQuery(event)
  const category = query.category as string | undefined

  const conditions = [eq(regulations.tenantId, session.tenantId)]

  if (category && VALID_CATEGORIES.includes(category as RegulationCategory)) {
    conditions.push(eq(regulations.category, category as RegulationCategory))
  }

  const rows = await db
    .select({
      id: regulations.id,
      title: regulations.title,
      category: regulations.category,
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
    .where(and(...conditions))
    .orderBy(desc(regulations.publishedAt))

  const data: Regulation[] = rows.map(row => ({
    id: row.id,
    title: row.title,
    category: row.category,
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
