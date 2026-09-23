/**
 * Consultas de pases de visita (qr_codes) compartidas por my-codes, GET/PATCH
 * /api/qr/[id] y cancel. Las reglas puras (estados, canEdit/canCancel,
 * validación) viven en shared/lib/qr-pass.ts; aquí solo se traducen a SQL.
 */
import { and, asc, desc, eq, gt, isNotNull, isNull, lte, not, or, sql, type SQL } from 'drizzle-orm'
import { db } from '~~/server/db'
import { accessLogs, qrCodes } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import { classifyQrStatus, qrPassPermissions, type QrPassState } from '~~/shared/lib/qr-pass'
import { zonedDateString } from '~~/shared/lib/zoned-date'
import type { QrPassItem, QrStatusFilter } from '~~/shared/types/qr'
import type { DbExecutor } from '~~/server/utils/access-entry-exit'

// ─── SQL ─────────────────────────────────────────────────────────────────────

/** Accesos permitidos ligados al pase (por qr_code_id o por token escaneado). */
function allowedAccessOfPass(): SQL {
  return sql`${accessLogs.tenantId} = ${qrCodes.tenantId}
    AND ${accessLogs.result} = 'allowed'
    AND (${accessLogs.qrCodeId} = ${qrCodes.id} OR ${accessLogs.passToken} = ${qrCodes.token})`
}

/** EXISTS: el pase tuvo al menos un acceso permitido. */
export function qrHasAccessCondition(): SQL {
  return sql`EXISTS (SELECT 1 FROM ${accessLogs} WHERE ${allowedAccessOfPass()})`
}

/** Instante del último acceso permitido del pase (null si nunca se usó). */
export function qrLastAccessAtSql() {
  return sql`(SELECT MAX(${accessLogs.createdAt}) FROM ${accessLogs} WHERE ${allowedAccessOfPass()})`
    .mapWith(accessLogs.createdAt)
}

/**
 * Condición SQL del estado del pase. Debe coincidir con classifyQrStatus()
 * (shared/lib/qr-pass.ts), que documenta la semántica.
 */
export function qrStatusCondition(status: QrStatusFilter, now: Date): SQL | undefined {
  const notCanceled = isNull(qrCodes.canceledAt)
  const expired = lte(qrCodes.expiresAt, now)
  switch (status) {
    case 'all':
      return undefined
    case 'canceled':
      return isNotNull(qrCodes.canceledAt)
    case 'active':
      return and(notCanceled, isNull(qrCodes.usedAt), gt(qrCodes.expiresAt, now))
    case 'used':
      return and(notCanceled, or(isNotNull(qrCodes.usedAt), and(expired, qrHasAccessCondition())))
    case 'expired':
      return and(notCanceled, isNull(qrCodes.usedAt), expired, not(qrHasAccessCondition()))
  }
}

/** true si el pase vence hoy (día local del condominio). */
function expiresTodaySql(tz: string): SQL {
  return sql`(${localDateOf(qrCodes.expiresAt, tz)} = ${localToday(tz)})`
}

/**
 * Orden de presentación por filtro:
 * - active:   primero los que vencen hoy, luego por vencimiento más próximo
 * - used:     uso más reciente primero (usedAt o último acceso)
 * - expired:  vencidos más recientemente primero
 * - canceled: cancelados más recientemente primero
 * - all:      activos primero (por vencimiento), el resto por creación desc
 */
export function qrStatusOrder(status: QrStatusFilter, now: Date, tz: string): SQL[] {
  switch (status) {
    case 'active':
      return [desc(expiresTodaySql(tz)), asc(qrCodes.expiresAt), desc(qrCodes.createdAt)]
    case 'used':
      return [sql`COALESCE(${qrCodes.usedAt}, ${qrLastAccessAtSql()}) DESC NULLS LAST`, desc(qrCodes.createdAt)]
    case 'expired':
      return [desc(qrCodes.expiresAt), desc(qrCodes.createdAt)]
    case 'canceled':
      return [desc(qrCodes.canceledAt), desc(qrCodes.createdAt)]
    case 'all': {
      const isActive = sql`(${qrCodes.canceledAt} IS NULL AND ${qrCodes.usedAt} IS NULL AND ${qrCodes.expiresAt} > ${now.toISOString()}::timestamp)`
      return [
        sql`${isActive} DESC`,
        sql`CASE WHEN ${isActive} THEN ${qrCodes.expiresAt} END ASC`,
        desc(qrCodes.createdAt),
      ]
    }
  }
}

/** Columnas necesarias para construir un QrPassItem (requiere join con units). */
export const qrPassColumns = {
  id: qrCodes.id,
  token: qrCodes.token,
  visitorName: qrCodes.visitorName,
  visitorDocument: qrCodes.visitorDocument,
  visitorType: qrCodes.visitorType,
  unitId: qrCodes.unitId,
  expiresAt: qrCodes.expiresAt,
  usedAt: qrCodes.usedAt,
  canceledAt: qrCodes.canceledAt,
  multiUse: qrCodes.multiUse,
  createdAt: qrCodes.createdAt,
  unitNumber: units.number,
  unitLabel: units.label,
  lastAccessAt: qrLastAccessAtSql(),
}

export interface QrPassRow {
  id: string
  token: string
  visitorName: string
  visitorDocument: string | null
  visitorType: 'invitado' | 'proveedor'
  unitId: string
  expiresAt: Date
  usedAt: Date | null
  canceledAt: Date | null
  multiUse: boolean
  createdAt: Date
  unitNumber: string
  unitLabel: string | null
  lastAccessAt: Date | null
}

export function qrPassStateOf(row: Pick<QrPassRow, 'expiresAt' | 'usedAt' | 'canceledAt' | 'lastAccessAt'>): QrPassState {
  return {
    expiresAt: row.expiresAt,
    usedAt: row.usedAt,
    canceledAt: row.canceledAt,
    hasAccess: row.lastAccessAt !== null,
  }
}

export function toQrPassItem(row: QrPassRow, now: Date, tz: string = getAppTimezone()): QrPassItem {
  const state = qrPassStateOf(row)
  return {
    id: row.id,
    token: row.token,
    visitorName: row.visitorName,
    visitorDocument: row.visitorDocument,
    visitorType: row.visitorType,
    unitId: row.unitId,
    unitNumber: row.unitNumber,
    unitLabel: row.unitLabel,
    expiresAt: row.expiresAt.toISOString(),
    usedAt: row.usedAt?.toISOString() ?? null,
    canceledAt: row.canceledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    status: classifyQrStatus(state, now),
    multiUse: row.multiUse,
    hasAccess: state.hasAccess,
    lastAccessAt: row.lastAccessAt?.toISOString() ?? null,
    expiresToday: zonedDateString(row.expiresAt, tz) === zonedDateString(now, tz),
    ...qrPassPermissions(state, now),
  }
}

/** Carga un pase del tenant con todo lo necesario para estado y permisos. */
export async function loadQrPass(exec: DbExecutor, tenantId: string, id: string): Promise<QrPassRow | null> {
  const [row] = await exec
    .select(qrPassColumns)
    .from(qrCodes)
    .innerJoin(units, eq(units.id, qrCodes.unitId))
    .where(and(eq(qrCodes.id, id), eq(qrCodes.tenantId, tenantId)))
    .limit(1)
  return row ?? null
}

// ─── Alcance (quién puede ver/editar/cancelar) ──────────────────────────────

export type QrPassAction = 'ver' | 'editar' | 'cancelar'

/**
 * Propietario y conserje solo operan pases de su unidad (conserje: la unidad
 * que gestiona en staff). Admin opera cualquier pase del tenant.
 */
export async function assertQrPassScope(
  userId: string,
  tenantId: string,
  role: string,
  passUnitId: string,
  action: QrPassAction,
): Promise<void> {
  if (role === 'admin') return
  const userUnitId = await getUnitIdForPass(userId, tenantId, role)
  if (!userUnitId) {
    throw createError({ statusCode: 400, message: 'Usuario sin unidad asignada' })
  }
  if (userUnitId !== passUnitId) {
    throw createError({ statusCode: 403, message: `No puedes ${action} pases de otra unidad` })
  }
}

/** Busca el pase (404 si no existe en el tenant) y verifica el alcance del usuario. */
export async function requireQrPassInScope(
  userId: string,
  tenantId: string,
  role: string,
  id: string,
  action: QrPassAction,
): Promise<QrPassRow> {
  const row = await loadQrPass(db, tenantId, id)
  if (!row) {
    throw createError({ statusCode: 404, message: 'Pase no encontrado' })
  }
  await assertQrPassScope(userId, tenantId, role, row.unitId, action)
  return row
}
