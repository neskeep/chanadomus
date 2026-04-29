import { db } from '~~/server/db'
import { qrCodes, accessLogs } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import { eq } from 'drizzle-orm'
import type { ValidationResult } from '~~/shared/types/qr'
import type { AccessEvent, AccessResult } from '~~/shared/types/access'
import { broadcastAccessEvent } from '~~/server/utils/ws-access'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const tenantId = (session.user as Record<string, unknown>).tenantId as string | undefined

  if (!tenantId) {
    throw createError({ statusCode: 403, message: 'Usuario sin tenant asignado' })
  }

  const body = await readBody<{ token: string }>(event)

  if (!body.token?.trim()) {
    throw createError({ statusCode: 400, message: 'token es requerido' })
  }

  // Buscar QR por token con join a units
  const [record] = await db
    .select({
      id: qrCodes.id,
      visitorName: qrCodes.visitorName,
      visitorDocument: qrCodes.visitorDocument,
      visitorType: qrCodes.visitorType,
      unitId: qrCodes.unitId,
      expiresAt: qrCodes.expiresAt,
      usedAt: qrCodes.usedAt,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(qrCodes)
    .innerJoin(units, eq(units.id, qrCodes.unitId))
    .where(eq(qrCodes.token, body.token.trim()))
    .limit(1)

  // Token no encontrado
  if (!record) {
    await logAccess({ tenantId, entryType: 'qr', result: 'denied', authorizedBy: session.user.id })
    const result: ValidationResult = { status: 'invalid' }
    return { data: result }
  }

  const now = new Date()

  // Ya usado
  if (record.usedAt) {
    await logAccess({
      tenantId, entryType: 'qr', result: 'already_used', qrCodeId: record.id,
      authorizedBy: session.user.id, visitorName: record.visitorName,
      visitorDocument: record.visitorDocument, unitId: record.unitId,
      unitNumber: record.unitNumber, unitLabel: record.unitLabel,
    })
    const result: ValidationResult = {
      status: 'already_used',
      visitorName: record.visitorName,
      unitNumber: record.unitNumber,
      usedAt: record.usedAt.toISOString(),
    }
    return { data: result }
  }

  // Expirado
  if (record.expiresAt <= now) {
    await logAccess({
      tenantId, entryType: 'qr', result: 'expired', qrCodeId: record.id,
      authorizedBy: session.user.id, visitorName: record.visitorName,
      visitorDocument: record.visitorDocument, unitId: record.unitId,
      unitNumber: record.unitNumber, unitLabel: record.unitLabel,
    })
    const result: ValidationResult = {
      status: 'expired',
      visitorName: record.visitorName,
      unitNumber: record.unitNumber,
    }
    return { data: result }
  }

  // Valido — marcar QR como usado y registrar acceso
  await db.update(qrCodes).set({ usedAt: now }).where(eq(qrCodes.id, record.id))

  await logAccess({
    tenantId, entryType: 'qr', result: 'allowed', qrCodeId: record.id,
    authorizedBy: session.user.id, visitorName: record.visitorName,
    visitorDocument: record.visitorDocument, unitId: record.unitId,
    unitNumber: record.unitNumber, unitLabel: record.unitLabel,
  })

  const result: ValidationResult = {
    status: 'valid',
    visitorName: record.visitorName,
    visitorDocument: record.visitorDocument,
    visitorType: record.visitorType,
    unitNumber: record.unitNumber,
    unitLabel: record.unitLabel,
    expiresAt: record.expiresAt.toISOString(),
  }
  return { data: result }
})

/** Helper to insert access log + broadcast event */
async function logAccess(params: {
  tenantId: string
  entryType: 'qr' | 'manual' | 'webhook'
  result: AccessResult
  qrCodeId?: string
  authorizedBy?: string
  visitorName?: string | null
  visitorDocument?: string | null
  unitId?: string
  unitNumber?: string | null
  unitLabel?: string | null
}) {
  const rows = await db
    .insert(accessLogs)
    .values({
      entryType: params.entryType,
      result: params.result,
      qrCodeId: params.qrCodeId ?? null,
      authorizedBy: params.authorizedBy ?? null,
      visitorName: params.visitorName ?? null,
      visitorDocument: params.visitorDocument ?? null,
      unitId: params.unitId ?? null,
      tenantId: params.tenantId,
    })
    .returning({ id: accessLogs.id, createdAt: accessLogs.createdAt })

  const log = rows[0]
  if (!log) return

  const accessEvent: AccessEvent = {
    id: log.id,
    entryType: params.entryType,
    result: params.result,
    visitorName: params.visitorName ?? null,
    visitorDocument: params.visitorDocument ?? null,
    unitNumber: params.unitNumber ?? null,
    unitLabel: params.unitLabel ?? null,
    notes: null,
    exitAt: null,
    createdAt: log.createdAt.toISOString(),
  }

  broadcastAccessEvent(accessEvent)
}
