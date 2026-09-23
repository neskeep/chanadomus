import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { qrCodes } from '~~/server/db/schema/access'
import { qrEditBlockReason, qrExpiresAtError, qrUpdateSchema } from '~~/shared/lib/qr-pass'
import type { QrPassItem } from '~~/shared/types/qr'

const paramsSchema = z.object({
  id: z.string().uuid('El pase no es válido'),
})

/**
 * PATCH /api/qr/[id]
 * Corrige un pase que todavía no se ha usado: nombre, cédula, vencimiento y
 * multiuso. El token (el QR que ya pudo recibir el visitante) no cambia.
 *
 * Solo si el pase está activo y nunca se usó (sin usedAt y sin ningún acceso
 * permitido). La comprobación y el UPDATE corren bajo withScanLock con el token
 * del pase: un escaneo simultáneo espera a que termine la edición, o la edición
 * ve el acceso recién registrado y responde 409.
 *
 * Errores: 400 validación, 403 otra unidad, 404 no existe, 409 estado no editable.
 */
export default defineEventHandler(async (event) => {
  const { tenantId, user } = await requireTenant(event)
  const session = await requireRole(event, ['propietario', 'conserje', 'admin'])
  const { id } = validateParams(event, paramsSchema)
  const body = parseOrThrow(qrUpdateSchema, await readBody(event))

  const expiresAt = body.expiresAt !== undefined ? new Date(body.expiresAt) : undefined
  if (expiresAt) {
    const expiresAtError = qrExpiresAtError(expiresAt)
    if (expiresAtError) {
      throw createError({ statusCode: 400, message: expiresAtError })
    }
  }

  // Alcance fuera del lock: unidad y token no cambian nunca
  const found = await requireQrPassInScope(user.id, tenantId, session.user.role as string, id, 'editar')

  const updated = await withScanLock(tenantId, found.token, async ({ tx, now }) => {
    // Relectura bajo el lock: usedAt y accesos pueden haber cambiado
    const current = await loadQrPass(tx, tenantId, id)
    if (!current) {
      throw createError({ statusCode: 404, message: 'Pase no encontrado' })
    }

    const blockReason = qrEditBlockReason(qrPassStateOf(current), now)
    if (blockReason) {
      throw createError({ statusCode: 409, message: blockReason })
    }

    await tx
      .update(qrCodes)
      .set({
        ...(body.visitorName !== undefined && { visitorName: body.visitorName }),
        ...(body.visitorDocument !== undefined && { visitorDocument: body.visitorDocument }),
        ...(expiresAt !== undefined && { expiresAt }),
        ...(body.multiUse !== undefined && { multiUse: body.multiUse }),
      })
      .where(and(eq(qrCodes.id, id), eq(qrCodes.tenantId, tenantId)))

    const after = await loadQrPass(tx, tenantId, id)
    if (!after) {
      throw createError({ statusCode: 500, message: 'No se pudo guardar el pase' })
    }
    return { row: after, now }
  })

  const data: QrPassItem = toQrPassItem(updated.row, updated.now)
  return { data }
})
