import { createHash } from 'node:crypto'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { devices } from '~~/server/db/schema/device'
import { qrCodes, accessLogs } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import type { WebhookScanPayload, AccessEvent, AccessResult } from '~~/shared/types/access'
import { broadcastAccessEvent } from '~~/server/utils/ws-access'
import { checkOpenEntry, findDuplicateScan, withScanLock, type ScanContext } from '~~/server/utils/access-entry-exit'

export default defineEventHandler(async (event) => {
  // 1. Read and validate device key
  const deviceKey = getHeader(event, 'X-Device-Key')
  if (!deviceKey?.trim()) {
    throw createError({ statusCode: 401, message: 'Device no autorizado' })
  }

  // 2. Hash the key
  const keyHash = createHash('sha256').update(deviceKey).digest('hex')

  // 3. Find active device by hash
  const [device] = await db
    .select({
      id: devices.id,
      name: devices.name,
      tenantId: devices.tenantId,
      location: devices.location,
    })
    .from(devices)
    .where(and(eq(devices.deviceKeyHash, keyHash), eq(devices.status, 'active')))
    .limit(1)

  if (!device) {
    throw createError({ statusCode: 401, message: 'Device no autorizado' })
  }

  // 4. Parse and validate body
  const body = await readBody<WebhookScanPayload>(event)

  if (!body.type || !body.value?.trim()) {
    throw createError({ statusCode: 400, message: 'type y value son requeridos' })
  }

  const validTypes = ['qr', 'pin', 'rfid'] as const
  if (!validTypes.includes(body.type)) {
    throw createError({ statusCode: 400, message: `type inválido: ${body.type}` })
  }

  // 5. Handle by scan type
  if (body.type === 'pin') {
    return { data: { status: 'unsupported', message: 'PIN no implementado aún' } }
  }

  if (body.type === 'rfid') {
    const rfidLogs = await db
      .insert(accessLogs)
      .values({
        entryType: 'webhook',
        deviceId: device.id,
        result: 'allowed',
        tenantId: device.tenantId,
        notes: 'RFID scan',
      })
      .returning({ id: accessLogs.id, createdAt: accessLogs.createdAt })

    const rfidLog = rfidLogs[0]!

    const accessEvent: AccessEvent = {
      id: rfidLog.id,
      entryType: 'webhook',
      result: 'allowed',
      visitorName: null,
      visitorDocument: null,
      unitNumber: null,
      unitLabel: null,
      notes: 'RFID scan',
      exitAt: null,
      createdAt: rfidLog.createdAt.toISOString(),
    }

    broadcastAccessEvent(accessEvent)
    return { data: accessEvent }
  }

  // QR scan flow — serializado por (tenant, token) para que un doble escaneo del
  // lector no cree dos filas ni convierta la entrada recién hecha en salida.
  const token = body.value.trim()
  return withScanLock(device.tenantId, token, ctx => processQrScan(ctx, token, device))
})

async function processQrScan(
  ctx: ScanContext,
  token: string,
  device: { id: string; tenantId: string },
) {
  const duplicate = await findDuplicateScan(ctx, device.tenantId, token)
  if (duplicate) {
    return {
      data: {
        status: 'duplicate' as const,
        message: duplicate.message,
        accessLogId: duplicate.accessLogId,
        direction: duplicate.direction,
        lastActionAt: duplicate.lastActionAt,
        secondsAgo: duplicate.secondsAgo,
        retryAfterSeconds: duplicate.retryAfterSeconds,
      },
    }
  }

  // Look up QR code with unit join
  const [qrRecord] = await ctx.tx
    .select({
      id: qrCodes.id,
      visitorName: qrCodes.visitorName,
      visitorDocument: qrCodes.visitorDocument,
      unitId: qrCodes.unitId,
      expiresAt: qrCodes.expiresAt,
      usedAt: qrCodes.usedAt,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(qrCodes)
    .innerJoin(units, eq(units.id, qrCodes.unitId))
    .where(and(eq(qrCodes.token, token), eq(qrCodes.tenantId, device.tenantId)))
    .limit(1)

  const now = ctx.now
  let result: AccessResult
  let qrCodeId: string | null = null
  let direction: 'entry' | 'exit' = 'entry'

  if (!qrRecord) {
    // Token not found
    result = 'denied'
  } else if (qrRecord.usedAt) {
    // Already used — check for open entry (exit scan)
    const openEntry = await checkOpenEntry(token, device.tenantId, ctx)
    if (openEntry.action === 'exit') {
      // Exit was already handled by checkOpenEntry (exitAt set, WS broadcast after commit)
      return {
        data: {
          id: openEntry.logId,
          entryType: 'webhook',
          result: 'allowed',
          visitorName: qrRecord.visitorName,
          visitorDocument: qrRecord.visitorDocument,
          unitNumber: qrRecord.unitNumber,
          unitLabel: qrRecord.unitLabel,
          notes: null,
          exitAt: openEntry.exitAt,
          createdAt: openEntry.entryAt,
          direction: 'exit',
        },
      }
    }
    result = 'already_used'
    qrCodeId = qrRecord.id
  } else if (qrRecord.expiresAt <= now) {
    result = 'expired'
    qrCodeId = qrRecord.id
  } else {
    // Valid — mark as used (entry)
    result = 'allowed'
    qrCodeId = qrRecord.id
    direction = 'entry'
    await ctx.tx
      .update(qrCodes)
      .set({ usedAt: now })
      .where(eq(qrCodes.id, qrRecord.id))
  }

  // Create access log
  const qrLogs = await ctx.tx
    .insert(accessLogs)
    .values({
      qrCodeId: qrCodeId,
      entryType: 'webhook',
      deviceId: device.id,
      result,
      tenantId: device.tenantId,
      visitorName: qrRecord?.visitorName ?? null,
      visitorDocument: qrRecord?.visitorDocument ?? null,
      unitId: qrRecord?.unitId ?? null,
      passToken: token,
      createdAt: now,
    })
    .returning({ id: accessLogs.id, createdAt: accessLogs.createdAt })

  const qrLog = qrLogs[0]!

  const accessEvent: AccessEvent = {
    id: qrLog.id,
    entryType: 'webhook',
    result,
    visitorName: qrRecord?.visitorName ?? null,
    visitorDocument: qrRecord?.visitorDocument ?? null,
    unitNumber: qrRecord?.unitNumber ?? null,
    unitLabel: qrRecord?.unitLabel ?? null,
    notes: null,
    exitAt: null,
    createdAt: qrLog.createdAt.toISOString(),
    direction,
  }

  ctx.afterCommit.push(() => broadcastAccessEvent(accessEvent))
  return { data: accessEvent }
}
