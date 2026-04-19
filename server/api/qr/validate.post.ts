import { db } from '~~/server/db'
import { qrCodes } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import { eq } from 'drizzle-orm'
import type { ValidationResult } from '~~/shared/types/qr'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token: string }>(event)

  if (!body.token?.trim()) {
    throw createError({ statusCode: 400, message: 'token es requerido' })
  }

  // Buscar QR por token con join a units
  const [record] = await db
    .select({
      visitorName: qrCodes.visitorName,
      visitorDocument: qrCodes.visitorDocument,
      visitorType: qrCodes.visitorType,
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
    const result: ValidationResult = { status: 'invalid' }
    return { data: result }
  }

  const now = new Date()

  // Ya usado
  if (record.usedAt) {
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
    const result: ValidationResult = {
      status: 'expired',
      visitorName: record.visitorName,
      unitNumber: record.unitNumber,
    }
    return { data: result }
  }

  // Valido
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
