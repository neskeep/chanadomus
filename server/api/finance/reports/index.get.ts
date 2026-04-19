import { db } from '~~/server/db'
import { financialReports } from '~~/server/db/schema/financial-report'
import { eq, desc, sql } from 'drizzle-orm'
import type { FinancialReport } from '~~/shared/types/financial'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin', 'propietario'])

  const query = getQuery(event)
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 10))
  const offset = (page - 1) * limit

  // Count total
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(financialReports)
    .where(eq(financialReports.tenantId, session.tenantId))

  // Fetch paginated
  const rows = await db
    .select()
    .from(financialReports)
    .where(eq(financialReports.tenantId, session.tenantId))
    .orderBy(desc(financialReports.year), desc(financialReports.month), desc(financialReports.createdAt))
    .limit(limit)
    .offset(offset)

  const data: FinancialReport[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    filePath: row.filePath,
    month: row.month,
    year: row.year,
    uploadedById: row.uploadedById,
    createdAt: row.createdAt.toISOString(),
  }))

  return {
    data,
    meta: { total: count, page, limit },
  }
})
