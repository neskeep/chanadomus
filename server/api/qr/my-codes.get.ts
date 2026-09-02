import { db } from '~~/server/db'
import { qrCodes } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import { eq, and, desc, gte, gt, isNull, or } from 'drizzle-orm'
import type { QrCodeRecord, QrStatus } from '~~/shared/types/qr'

function computeStatus(expiresAt: Date, usedAt: Date | null, canceledAt: Date | null): QrStatus {
  // Cancelacion tiene precedencia sobre usado/expirado/activo
  if (canceledAt) return 'canceled'
  if (usedAt) return 'used'
  if (expiresAt <= new Date()) return 'expired'
  return 'active'
}

export default defineEventHandler(async (event) => {
  const { tenantId, user } = await requireTenant(event)
  const session = await requireRole(event, ['propietario', 'admin', 'conserje'])

  const query = getQuery(event)
  const statusFilter = (query.status as string) || 'all'

  if (!['all', 'active', 'used', 'expired', 'canceled'].includes(statusFilter)) {
    throw createError({ statusCode: 400, message: 'status debe ser "all", "active", "used", "expired" o "canceled"' })
  }

  // Filtrar por unitId para que propietario y conserje vean todos los pases de su unidad
  const userUnitId = await getUnitIdForPass(user.id, tenantId, session.user.role as string)
  if (!userUnitId) {
    throw createError({ statusCode: 400, message: 'Usuario sin unidad asignada' })
  }
  const unitFilter = eq(qrCodes.unitId, userUnitId)

  // Mostrar codigos de los ultimos 30 dias + cualquier codigo activo (sin expirar, sin usar)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const rows = await db
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
    .where(and(
      unitFilter,
      eq(qrCodes.tenantId, tenantId),
      or(
        gte(qrCodes.createdAt, thirtyDaysAgo),
        and(gt(qrCodes.expiresAt, new Date()), isNull(qrCodes.usedAt), isNull(qrCodes.canceledAt)),
      ),
    ))
    // Trae los mas recientes primero para respetar el limit; el orden de
    // presentacion (activos por vencimiento) se aplica en JS mas abajo
    .orderBy(desc(qrCodes.createdAt))
    .limit(50)

  const records: QrCodeRecord[] = rows.map((row) => {
    const status = computeStatus(row.expiresAt, row.usedAt, row.canceledAt)
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
      status,
    }
  })

  // Orden de presentacion: activos primero (el que vence antes, primero);
  // el resto (usados/expirados/cancelados) por creacion mas reciente
  const sorted = [...records].sort((a, b) => {
    const aActive = a.status === 'active'
    const bActive = b.status === 'active'
    if (aActive && bActive) {
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    }
    if (aActive !== bActive) {
      return aActive ? -1 : 1
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const filtered = statusFilter === 'all'
    ? sorted
    : sorted.filter((r) => r.status === statusFilter)

  return { data: filtered }
})
