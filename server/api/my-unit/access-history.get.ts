import { eq, and, gte, desc, sql, or } from 'drizzle-orm'
import { db } from '~~/server/db'
import { accessLogs, qrCodes } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import type { AccessEvent } from '~~/shared/types/access'
import { countedEntryCondition, openEntryStillValidCondition } from '~~/server/utils/access-entry-exit'
import { OWNER_VIEW_OPEN_ENTRY_MAX_AGE_MS } from '~~/server/utils/access-scan-rules'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['propietario', 'admin', 'conserje'])
  const { tenantId } = await requireTenant(event)

  const unitId = await getUnitIdForPass(session.user.id, tenantId, session.user.role as string)
  if (!unitId) {
    return { data: [] }
  }

  // Last 30 days
  const now = new Date()
  const since = new Date(now)
  since.setDate(since.getDate() - 30)

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
        // Solo entradas reales: excluye resultados no permitidos y filas "solo salida"
        // (salida registrada sin entrada abierta). Filtro de lectura: los datos siguen en la DB.
        countedEntryCondition(),
        gte(accessLogs.createdAt, since),
        or(
          eq(accessLogs.unitId, unitId),
          eq(qrCodes.unitId, unitId),
        ),
        // Entradas sin salida: solo las de las últimas 24 h y no marcadas expired_open.
        // El escáner usa una ventana mayor (OPEN_ENTRY_WINDOW_MS) para bloquear re-entradas.
        openEntryStillValidCondition(now, OWNER_VIEW_OPEN_ENTRY_MAX_AGE_MS),
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
