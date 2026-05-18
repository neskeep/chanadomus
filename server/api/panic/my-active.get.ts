import { eq, and, isNull, gt, desc } from 'drizzle-orm'
import { db } from '~~/server/db'
import { panicEvents } from '~~/server/db/schema/panic'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  // Only consider alerts from the last 24 hours to avoid stale test data
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [active] = await db
    .select({ id: panicEvents.id, createdAt: panicEvents.createdAt })
    .from(panicEvents)
    .where(
      and(
        eq(panicEvents.userId, session.user.id),
        eq(panicEvents.tenantId, session.tenantId),
        isNull(panicEvents.resolvedAt),
        gt(panicEvents.createdAt, cutoff),
      ),
    )
    .orderBy(desc(panicEvents.createdAt))
    .limit(1)

  return { data: active ? { id: active.id, createdAt: active.createdAt.toISOString() } : null }
})
