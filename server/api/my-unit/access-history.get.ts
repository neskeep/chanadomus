import { eq, and, gte, desc, sql, or, isNotNull } from 'drizzle-orm'
import { db } from '~~/server/db'
import { accessLogs, qrCodes } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import type { AccessEvent } from '~~/shared/types/access'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['propietario', 'admin', 'conserje'])
  const { tenantId } = await requireTenant(event)

  const unitId = await getUnitIdForPass(session.user.id, tenantId, session.user.role as string)
  if (!unitId) {
    return { data: [] }
  }

  // Last 30 days
  const since = new Date()
  since.setDate(since.getDate() - 30)

  // Entries without exitAt older than 24h are considered abandoned
  const last24h = new Date()
  last24h.setHours(last24h.getHours() - 24)

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
        eq(accessLogs.result, 'allowed'),
        gte(accessLogs.createdAt, since),
        or(
          eq(accessLogs.unitId, unitId),
          eq(qrCodes.unitId, unitId),
        ),
        // Exclude abandoned entries (no exit, older than 24h)
        or(
          isNotNull(accessLogs.exitAt),
          gte(accessLogs.createdAt, last24h),
        ),
      ),
    )
    .orderBy(desc(accessLogs.createdAt))
    .limit(30)

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
  }))

  return { data }
})
