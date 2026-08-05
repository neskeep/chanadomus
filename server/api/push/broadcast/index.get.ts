import { eq, desc } from 'drizzle-orm'
import { db } from '~~/server/db'
import { broadcasts } from '~~/server/db/schema/broadcast'
import { user } from '~~/server/db/schema/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const session = await requireTenant(event)

  const results = await db.select({
    id: broadcasts.id,
    title: broadcasts.title,
    body: broadcasts.body,
    createdAt: broadcasts.createdAt,
    authorName: user.name,
  })
    .from(broadcasts)
    .leftJoin(user, eq(broadcasts.authorId, user.id))
    .where(eq(broadcasts.tenantId, session.tenantId))
    .orderBy(desc(broadcasts.createdAt))
    .limit(50)

  return { data: results }
})
