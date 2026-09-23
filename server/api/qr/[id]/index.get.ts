import { z } from 'zod'
import type { QrPassItem } from '~~/shared/types/qr'

const paramsSchema = z.object({
  id: z.string().uuid('El pase no es válido'),
})

/**
 * GET /api/qr/[id]
 * Un pase con estado y permisos (canEdit/canCancel) para la página de edición.
 * Mismo alcance que cancel: propietario/conserje su unidad, admin todo el tenant.
 */
export default defineEventHandler(async (event) => {
  const { tenantId, user } = await requireTenant(event)
  const session = await requireRole(event, ['propietario', 'conserje', 'admin'])
  const { id } = validateParams(event, paramsSchema)

  const record = await requireQrPassInScope(user.id, tenantId, session.user.role as string, id, 'ver')

  const data: QrPassItem = toQrPassItem(record, new Date())
  return { data }
})
