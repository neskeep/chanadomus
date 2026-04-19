import { createHash } from 'node:crypto'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { devices } from '~~/server/db/schema/device'
import { qrCodes, accessLogs } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import type { WebhookScanPayload, AccessEvent, AccessResult } from '~~/shared/types/access'
import { broadcastAccessEvent } from '~~/server/utils/ws-access'

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
      createdAt: rfidLog.createdAt.toISOString(),
    }

    broadcastAccessEvent(accessEvent)
    return { data: accessEvent }
  }

  // QR scan flow
  const token = body.value.trim()

  // Look up QR code with unit join
  const [qrRecord] = await db
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
    .where(eq(qrCodes.token, token))
    .limit(1)

  const now = new Date()
  let result: AccessResult
  let qrCodeId: string | null = null

  if (!qrRecord) {
    // Token not found
    result = 'denied'
  } else if (qrRecord.usedAt) {
    result = 'already_used'
    qrCodeId = qrRecord.id
  } else if (qrRecord.expiresAt <= now) {
    result = 'expired'
    qrCodeId = qrRecord.id
  } else {
    // Valid — mark as used
    result = 'allowed'
    qrCodeId = qrRecord.id
    await db
      .update(qrCodes)
      .set({ usedAt: now })
      .where(eq(qrCodes.id, qrRecord.id))
  }

  // Create access log
  const qrLogs = await db
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
    createdAt: qrLog.createdAt.toISOString(),
  }

  broadcastAccessEvent(accessEvent)
  return { data: accessEvent }
})
