import { z } from 'zod'
import { eq, and, isNull, gt } from 'drizzle-orm'
import { db } from '~~/server/db'
import { qrCodes } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import type { QrCodeRecord } from '~~/shared/types/qr'

const paramsSchema = z.object({
  id: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
  const { tenantId, user } = await requireTenant(event)
  const session = await requireRole(event, ['propietario', 'conserje', 'admin'])

  const { id } = validateParams(event, paramsSchema)

  const role = session.user.role as string

  // Localizar el pase dentro del tenant, con datos de unidad para la respuesta
  const [record] = await db
    .select({
      id: qrCodes.id,
      token: qrCodes.token,
      visitorName: qrCodes.visitorName,
      visitorDocument: qrCodes.visitorDocument,
      visitorType: qrCodes.visitorType,
      unitId: qrCodes.unitId,
      expiresAt: qrCodes.expiresAt,
      usedAt: qrCodes.usedAt,
      canceledAt: qrCodes.canceledAt,
      createdAt: qrCodes.createdAt,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(qrCodes)
    .innerJoin(units, eq(units.id, qrCodes.unitId))
    .where(and(eq(qrCodes.id, id), eq(qrCodes.tenantId, tenantId)))
    .limit(1)

  if (!record) {
    throw createError({ statusCode: 404, message: 'Pase no encontrado' })
  }

  // Scoping: propietario/conserje solo pueden cancelar pases de su unidad.
  // Admin puede cancelar cualquier pase del tenant.
  if (role !== 'admin') {
    const userUnitId = await getUnitIdForPass(user.id, tenantId, role)
    if (!userUnitId) {
      throw createError({ statusCode: 400, message: 'Usuario sin unidad asignada' })
    }
    if (record.unitId !== userUnitId) {
      throw createError({ statusCode: 403, message: 'No puedes cancelar pases de otra unidad' })
    }
  }

  const now = new Date()

  // Validar que el pase este ACTIVO: no usado, no expirado, no ya cancelado
  if (record.canceledAt) {
    throw createError({ statusCode: 400, message: 'El pase ya fue cancelado' })
  }
  if (record.usedAt) {
    throw createError({ statusCode: 400, message: 'No se puede cancelar un pase que ya fue usado' })
  }
  if (record.expiresAt <= now) {
    throw createError({ statusCode: 400, message: 'No se puede cancelar un pase expirado' })
  }

  // Cancelar de forma atomica: solo actualiza si sigue activo (evita carreras)
  const [updated] = await db
    .update(qrCodes)
    .set({ canceledAt: now, canceledBy: user.id })
    .where(and(
      eq(qrCodes.id, id),
      eq(qrCodes.tenantId, tenantId),
      isNull(qrCodes.canceledAt),
      isNull(qrCodes.usedAt),
      gt(qrCodes.expiresAt, now),
    ))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 400, message: 'El pase ya no puede ser cancelado' })
  }

  const data: QrCodeRecord = {
    id: updated.id,
    token: updated.token,
    visitorName: updated.visitorName,
    visitorDocument: updated.visitorDocument,
    visitorType: updated.visitorType,
    unitId: updated.unitId,
    unitNumber: record.unitNumber,
    unitLabel: record.unitLabel,
    expiresAt: updated.expiresAt.toISOString(),
    usedAt: updated.usedAt?.toISOString() ?? null,
    canceledAt: updated.canceledAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    status: 'canceled',
  }

  return { data }
})
