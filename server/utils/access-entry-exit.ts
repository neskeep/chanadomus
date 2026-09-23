import { eq, and, or, not, isNull, isNotNull, gte, desc, sql, type SQL } from 'drizzle-orm'
import { db } from '~~/server/db'
import { accessLogs, qrCodes } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import { broadcastAccessMessage } from '~~/server/utils/ws-access'
import type { AccessDirection } from '~~/shared/types/qr'
import {
  EXIT_ONLY_TOLERANCE_MS,
  OPEN_ENTRY_WINDOW_MS,
  SCAN_DEDUPE_WINDOW_MS,
  evaluateScanDedupe,
  formatDuplicateScanMessage,
  lastActionOfLog,
  scanLockKey,
} from '~~/server/utils/access-scan-rules'

// ─── Condiciones SQL compartidas ─────────────────────────────────────────────

/**
 * Fila "solo salida": se registró una salida sin entrada abierta, así que
 * exit_at ≈ created_at. Misma regla que isExitOnlyLog() en access-scan-rules.
 */
export function exitOnlyCondition(): SQL {
  const toleranceSeconds = sql.raw(String(Math.floor(EXIT_ONLY_TOLERANCE_MS / 1000)))
  return sql`(${accessLogs.exitAt} IS NOT NULL AND ${accessLogs.exitAt} <= ${accessLogs.createdAt} + (${toleranceSeconds} * interval '1 second'))`
}

/**
 * Condición SQL de "entrada contabilizable" en access_logs:
 * - solo accesos permitidos (excluye denied, expired, already_used)
 * - excluye filas "solo salida" (exitOnlyCondition)
 * Fuente única para el badge "N hoy", la barra de hoy, el contador de entradas
 * y la vista del propietario.
 */
export function countedEntryCondition(): SQL {
  return and(eq(accessLogs.result, 'allowed'), not(exitOnlyCondition())) as SQL
}

/**
 * Entradas visibles como "sin salida": solo las que el sistema aún considera
 * abiertas (dentro de OPEN_ENTRY_WINDOW_MS y no marcadas expired_open).
 * Las filas con salida siempre pasan.
 */
export function openEntryStillValidCondition(
  now: Date = new Date(),
  maxAgeMs: number = OPEN_ENTRY_WINDOW_MS,
): SQL {
  return or(
    isNotNull(accessLogs.exitAt),
    and(
      eq(accessLogs.expiredOpen, false),
      gte(accessLogs.createdAt, new Date(now.getTime() - maxAgeMs)),
    ),
  ) as SQL
}

// ─── Lock por credencial ─────────────────────────────────────────────────────

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
export type DbExecutor = typeof db | Transaction

/** Contexto de un escaneo serializado: todas las lecturas/escrituras van por `tx`. */
export interface ScanContext {
  tx: Transaction
  /** Hora del escaneo, tomada después de obtener el lock */
  now: Date
  /** Efectos a ejecutar solo si la transacción hace commit (broadcast WS) */
  afterCommit: Array<() => void>
}

/**
 * Ejecuta `fn` en una transacción con pg_advisory_xact_lock sobre (tenant, token).
 *
 * Se usa advisory lock y no SELECT ... FOR UPDATE porque el token puede estar en
 * seis tablas distintas (qr_codes, resident_passes, household_member_passes,
 * vehicle_passes, service_staff_passes, staff) o en ninguna (token inválido): un
 * lock por clave cubre todos los casos con un solo camino. Dos escaneos
 * simultáneos del mismo pase se serializan; el segundo ve la fila del primero
 * (READ COMMITTED toma snapshot nuevo por sentencia) y responde como duplicado.
 * El lock se libera solo al terminar la transacción, incluso si falla.
 */
export async function withScanLock<T>(
  tenantId: string,
  token: string,
  fn: (ctx: ScanContext) => Promise<T>,
): Promise<T> {
  const afterCommit: Array<() => void> = []
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${scanLockKey(tenantId, token)}, 0))`)
    return fn({ tx, now: new Date(), afterCommit })
  })

  for (const effect of afterCommit) {
    try {
      effect()
    }
    catch (err) {
      console.error('[access-scan] afterCommit effect failed:', err)
    }
  }
  return result
}

// ─── Anti doble escaneo ──────────────────────────────────────────────────────

export interface DuplicateScan {
  accessLogId: string
  /** Dirección de la acción previa que se está repitiendo */
  direction: AccessDirection
  lastActionAt: string
  secondsAgo: number
  retryAfterSeconds: number
  message: string
  visitorName: string | null
  unitNumber: string | null
  unitLabel: string | null
}

/**
 * Busca la última acción permitida (entrada o salida) sobre el token y decide si
 * el escaneo actual es un duplicado. Debe llamarse dentro de withScanLock para
 * que la decisión y la escritura posterior sean atómicas.
 */
export async function findDuplicateScan(
  ctx: ScanContext,
  tenantId: string,
  token: string,
  windowMs: number = SCAN_DEDUPE_WINDOW_MS,
): Promise<DuplicateScan | null> {
  if (windowMs <= 0) return null

  const since = new Date(ctx.now.getTime() - windowMs)
  const [last] = await ctx.tx
    .select({
      id: accessLogs.id,
      createdAt: accessLogs.createdAt,
      exitAt: accessLogs.exitAt,
      logVisitorName: accessLogs.visitorName,
      qrVisitorName: qrCodes.visitorName,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(accessLogs)
    .leftJoin(qrCodes, eq(qrCodes.id, accessLogs.qrCodeId))
    .leftJoin(units, eq(units.id, sql`COALESCE(${accessLogs.unitId}, ${qrCodes.unitId})`))
    .where(
      and(
        eq(accessLogs.tenantId, tenantId),
        eq(accessLogs.passToken, token),
        eq(accessLogs.result, 'allowed'),
        or(gte(accessLogs.createdAt, since), gte(accessLogs.exitAt, since)),
      ),
    )
    .orderBy(desc(sql`GREATEST(${accessLogs.createdAt}, COALESCE(${accessLogs.exitAt}, ${accessLogs.createdAt}))`))
    .limit(1)

  if (!last) return null

  const decision = evaluateScanDedupe(lastActionOfLog(last.createdAt, last.exitAt), ctx.now, windowMs)
  if (!decision.duplicate) return null

  return {
    accessLogId: last.id,
    direction: decision.direction,
    lastActionAt: decision.at.toISOString(),
    secondsAgo: decision.secondsAgo,
    retryAfterSeconds: decision.retryAfterSeconds,
    message: formatDuplicateScanMessage(decision.direction, decision.secondsAgo),
    visitorName: last.logVisitorName ?? last.qrVisitorName ?? null,
    unitNumber: last.unitNumber,
    unitLabel: last.unitLabel,
  }
}

// ─── Entradas abiertas ───────────────────────────────────────────────────────

async function findOpenEntry(exec: DbExecutor, passToken: string, tenantId: string) {
  const [openLog] = await exec
    .select({
      id: accessLogs.id,
      createdAt: accessLogs.createdAt,
    })
    .from(accessLogs)
    .where(
      and(
        eq(accessLogs.passToken, passToken),
        eq(accessLogs.tenantId, tenantId),
        eq(accessLogs.result, 'allowed'),
        isNull(accessLogs.exitAt),
        eq(accessLogs.expiredOpen, false),
      ),
    )
    .orderBy(desc(accessLogs.createdAt))
    .limit(1)
  return openLog ?? null
}

export interface HasOpenEntryResult {
  exists: boolean
  logId?: string
  entryAt?: string
}

/**
 * Check if there's an open (non-expired) entry for this token — read-only, no side effects.
 * Used to prevent duplicate consecutive entries for the same pass.
 */
export async function hasOpenEntry(
  passToken: string,
  tenantId: string,
  ctx?: ScanContext,
): Promise<HasOpenEntryResult> {
  const openLog = await findOpenEntry(ctx?.tx ?? db, passToken, tenantId)
  if (!openLog) {
    return { exists: false }
  }

  const now = ctx?.now ?? new Date()
  if (now.getTime() - openLog.createdAt.getTime() > OPEN_ENTRY_WINDOW_MS) {
    return { exists: false }
  }

  return {
    exists: true,
    logId: openLog.id,
    entryAt: openLog.createdAt.toISOString(),
  }
}

export interface OpenEntryResult {
  /** 'exit' = open entry within window → marked exit. 'expired' = found but beyond window → flagged. null = no open entry. */
  action: 'exit' | 'expired' | null
  /** The access log that was closed (exit) or flagged (expired) */
  logId?: string
  exitAt?: string
  entryAt?: string
}

/**
 * Check if there's an open access log for this token and handle accordingly:
 * - Within OPEN_ENTRY_WINDOW_MS → mark exit, broadcast, return 'exit'
 * - Beyond the window → mark expired_open, return 'expired'
 * - No open entry → return null
 * With `ctx`, writes go through the scan transaction and the broadcast waits for commit.
 */
export async function checkOpenEntry(
  passToken: string,
  tenantId: string,
  ctx?: ScanContext,
): Promise<OpenEntryResult> {
  const exec: DbExecutor = ctx?.tx ?? db
  const openLog = await findOpenEntry(exec, passToken, tenantId)

  if (!openLog) {
    return { action: null }
  }

  const now = ctx?.now ?? new Date()

  if (now.getTime() - openLog.createdAt.getTime() > OPEN_ENTRY_WINDOW_MS) {
    // Beyond the window — flag as expired_open for investigation, don't close
    await exec
      .update(accessLogs)
      .set({ expiredOpen: true })
      .where(eq(accessLogs.id, openLog.id))

    return { action: 'expired', logId: openLog.id, entryAt: openLog.createdAt.toISOString() }
  }

  const exitAt = now

  await exec
    .update(accessLogs)
    .set({ exitAt })
    .where(
      and(
        eq(accessLogs.id, openLog.id),
        isNull(accessLogs.exitAt),
      ),
    )

  const broadcast = () => broadcastAccessMessage('access-exit', { id: openLog.id, exitAt: exitAt.toISOString() })
  if (ctx) ctx.afterCommit.push(broadcast)
  else broadcast()

  return {
    action: 'exit',
    logId: openLog.id,
    exitAt: exitAt.toISOString(),
    entryAt: openLog.createdAt.toISOString(),
  }
}
