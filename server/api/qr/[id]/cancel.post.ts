import { z } from 'zod'
import { eq, and, isNull, gt } from 'drizzle-orm'
import { db } from '~~/server/db'
import { qrCodes } from '~~/server/db/schema/access'
import { qrCancelBlockReason } from '~~/shared/lib/qr-pass'
import type { QrPassItem } from '~~/shared/types/qr'

const paramsSchema = z.object({
  id: z.string().uuid(),
})

/**
 * POST /api/qr/[id]/cancel
 * Anula un pase activo sin usedAt. Propietario/conserje: solo pases de su unidad;
 * admin: cualquier pase del tenant. Responde { data: QrPassItem }.
 */
export default defineEventHandler(async (event) => {
  const { tenantId, user } = await requireTenant(event)
  const session = await requireRole(event, ['propietario', 'conserje', 'admin'])
  const { id } = validateParams(event, paramsSchema)

  const record = await requireQrPassInScope(user.id, tenantId, session.user.role as string, id, 'cancelar')

  const now = new Date()
  const blockReason = qrCancelBlockReason(qrPassStateOf(record), now)
  if (blockReason) {
    throw createError({ statusCode: 400, message: blockReason })
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
    .returning({ canceledAt: qrCodes.canceledAt })

  if (!updated) {
    throw createError({ statusCode: 400, message: 'El pase ya no puede ser cancelado' })
  }

  const data: QrPassItem = toQrPassItem({ ...record, canceledAt: updated.canceledAt }, now)
  return { data }
})
