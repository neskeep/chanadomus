import { eq, and, gte, lt, desc, sql } from 'drizzle-orm'
import { db } from '~~/server/db'
import { accessLogs, qrCodes } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import type { AccessEvent } from '~~/shared/types/access'
import { accessLogKind } from '~~/server/utils/access-scan-rules'
import { isDateString } from '~~/shared/lib/zoned-date'

export default defineEventHandler(async (event) => {
  // 1. Auth: conserje, vigilancia, admin
  await requireRole(event, ['conserje', 'vigilancia', 'admin'])
  const { tenantId } = await requireTenant(event)

  // 2. Parse query params
  const query = getQuery(event)

  const dateStr = typeof query.date === 'string' ? query.date : null
  const limitParam = typeof query.limit === 'string' ? parseInt(query.limit, 10) : 50
  const limit = Math.min(Math.max(limitParam || 50, 1), 100)

  // 3. Calculate date range — el día se interpreta en la zona del condominio
  const day = dateStr && isDateString(dateStr) ? dateStr : localTodayString()
  const { start: startOfDay, end: startOfNextDay } = localDateRangeToUtc(day, day)

  // 4. Query with LEFT JOINs
  const rows = await db
    .select({
      id: accessLogs.id,
      entryType: accessLogs.entryType,
      result: accessLogs.result,
      logVisitorName: accessLogs.visitorName,
      qrVisitorName: qrCodes.visitorName,
      visitorDocument: accessLogs.visitorDocument,
      unitNumber: units.number,
      unitLabel: units.label,
      notes: accessLogs.notes,
      exitAt: accessLogs.exitAt,
      createdAt: accessLogs.createdAt,
    })
    .from(accessLogs)
    .leftJoin(qrCodes, eq(qrCodes.id, accessLogs.qrCodeId))
    .leftJoin(units, eq(units.id, sql`COALESCE(${accessLogs.unitId}, ${qrCodes.unitId})`))
    .where(
      and(
        eq(accessLogs.tenantId, tenantId),
        gte(accessLogs.createdAt, startOfDay),
        lt(accessLogs.createdAt, startOfNextDay),
      ),
    )
    .orderBy(desc(accessLogs.createdAt))
    .limit(limit)

  // 5. Map to AccessEvent
  const data: AccessEvent[] = rows.map((row) => ({
    id: row.id,
    entryType: row.entryType,
    result: row.result,
    visitorName: row.logVisitorName ?? row.qrVisitorName ?? null,
    visitorDocument: row.visitorDocument,
    unitNumber: row.unitNumber,
    unitLabel: row.unitLabel,
    notes: row.notes,
    exitAt: row.exitAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    // Staff ve todas las filas; `kind` marca las de "solo salida" para distinguirlas
    kind: row.result === 'allowed' ? accessLogKind(row.createdAt, row.exitAt) : undefined,
  }))

  return { data }
})
