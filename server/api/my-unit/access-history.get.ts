import { z } from 'zod'
import { eq, and, gte, lt, desc, sql, or, count } from 'drizzle-orm'
import { db } from '~~/server/db'
import { accessLogs, qrCodes } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import type { AccessEvent, UnitAccessHistoryMeta } from '~~/shared/types/access'
import { countedEntryCondition, openEntryStillValidCondition } from '~~/server/utils/access-entry-exit'
import { OWNER_VIEW_OPEN_ENTRY_MAX_AGE_MS } from '~~/server/utils/access-scan-rules'
import { hasMorePages, pageOffset, paginationQuerySchema } from '~~/shared/lib/pagination'
import {
  UNIT_ACCESS_DEFAULT_LIMIT,
  UNIT_ACCESS_DEFAULT_RANGE,
  UNIT_ACCESS_MAX_LIMIT,
  UNIT_ACCESS_RANGES,
  unitAccessRangeDates,
} from '~~/shared/lib/access-history-range'

const querySchema = paginationQuerySchema(UNIT_ACCESS_DEFAULT_LIMIT, UNIT_ACCESS_MAX_LIMIT).extend({
  range: z.enum(UNIT_ACCESS_RANGES, { error: 'range debe ser "today", "7d" o "30d"' }).default(UNIT_ACCESS_DEFAULT_RANGE),
})

/**
 * GET /api/my-unit/access-history?range=today|7d|30d&page=1&limit=20
 * Accesos registrados a la vivienda del usuario (propietario: su unidad;
 * conserje: la unidad que gestiona). `range` en días locales del condominio,
 * contando hoy. Solo entradas contabilizables (sin filas de solo salida) y
 * entradas sin salida de máximo 24 h. Orden: más reciente primero.
 */
export default defineEventHandler(async (event): Promise<{ data: AccessEvent[]; meta: UnitAccessHistoryMeta }> => {
  const session = await requireRole(event, ['propietario', 'admin', 'conserje'])
  const { tenantId } = await requireTenant(event)
  const { range, page, limit } = parseOrThrow(querySchema, getQuery(event))

  const now = new Date()
  const { from, to } = unitAccessRangeDates(range, localTodayString(now))
  const emptyMeta: UnitAccessHistoryMeta = { total: 0, page, limit, hasMore: false, range, from, to }

  const unitId = await getUnitIdForPass(session.user.id, tenantId, session.user.role as string)
  if (!unitId) {
    return { data: [], meta: emptyMeta }
  }

  const { start, end } = localDateRangeToUtc(from, to)

  const where = and(
    eq(accessLogs.tenantId, tenantId),
    // Solo entradas reales: excluye resultados no permitidos y filas "solo salida"
    // (salida registrada sin entrada abierta). Filtro de lectura: los datos siguen en la DB.
    countedEntryCondition(),
    gte(accessLogs.createdAt, start),
    lt(accessLogs.createdAt, end),
    or(
      eq(accessLogs.unitId, unitId),
      eq(qrCodes.unitId, unitId),
    ),
    // Entradas sin salida: solo las de las últimas 24 h y no marcadas expired_open.
    // El escáner usa una ventana mayor (OPEN_ENTRY_WINDOW_MS) para bloquear re-entradas.
    openEntryStillValidCondition(now, OWNER_VIEW_OPEN_ENTRY_MAX_AGE_MS),
  )

  const [rows, totals] = await Promise.all([
    db
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
      .where(where)
      .orderBy(desc(accessLogs.createdAt), desc(accessLogs.id))
      .limit(limit)
      .offset(pageOffset(page, limit)),
    db
      .select({ total: count() })
      .from(accessLogs)
      .leftJoin(qrCodes, eq(qrCodes.id, accessLogs.qrCodeId))
      .where(where),
  ])

  const total = totals[0]?.total ?? 0

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

  return { data, meta: { ...emptyMeta, total, hasMore: hasMorePages(page, limit, total) } }
})
