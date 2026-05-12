import { db } from '~~/server/db'
import { frequentVisitors } from '~~/server/db/schema/frequent-visitor'
import { eq, and, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { tenantId, user } = await requireTenant(event)
  await requireRole(event, ['propietario', 'admin'])

  const rows = await db
    .select()
    .from(frequentVisitors)
    .where(
      and(
        eq(frequentVisitors.ownerId, user.id),
        eq(frequentVisitors.tenantId, tenantId),
      ),
    )
    .orderBy(desc(frequentVisitors.lastVisitAt), desc(frequentVisitors.visitCount))

  return {
    data: rows.map((row) => ({
      ...row,
      lastVisitAt: row.lastVisitAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  }
})
