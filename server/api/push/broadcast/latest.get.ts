import { eq, desc } from 'drizzle-orm'
import { db } from '~~/server/db'
import { broadcasts } from '~~/server/db/schema/broadcast'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  // Only return broadcasts from the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [latest] = await db.select({
    id: broadcasts.id,
    title: broadcasts.title,
    body: broadcasts.body,
    createdAt: broadcasts.createdAt,
  })
    .from(broadcasts)
    .where(
      eq(broadcasts.tenantId, session.tenantId),
    )
    .orderBy(desc(broadcasts.createdAt))
    .limit(1)

  // Return null if no broadcast or if it's older than 24h
  if (!latest || latest.createdAt < oneDayAgo) {
    return { data: null }
  }

  return { data: latest }
})
