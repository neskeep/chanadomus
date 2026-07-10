import { db } from '~~/server/db'
import { qrCodes } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import { eq, and, desc, gte, gt, isNull, or } from 'drizzle-orm'
import type { QrCodeRecord, QrStatus } from '~~/shared/types/qr'

function computeStatus(expiresAt: Date, usedAt: Date | null): QrStatus {
  if (usedAt) return 'used'
  if (expiresAt <= new Date()) return 'expired'
  return 'active'
}

export default defineEventHandler(async (event) => {
  const { tenantId, user } = await requireTenant(event)
  const session = await requireRole(event, ['propietario', 'admin', 'conserje'])

  const query = getQuery(event)
  const statusFilter = (query.status as string) || 'all'

  if (!['all', 'active', 'used', 'expired'].includes(statusFilter)) {
    throw createError({ statusCode: 400, message: 'status debe ser "all", "active", "used" o "expired"' })
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
        and(gt(qrCodes.expiresAt, new Date()), isNull(qrCodes.usedAt)),
      ),
    ))
    .orderBy(desc(qrCodes.createdAt))
    .limit(50)

  const records: QrCodeRecord[] = rows.map((row) => {
    const status = computeStatus(row.expiresAt, row.usedAt)
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
      createdAt: row.createdAt.toISOString(),
      status,
    }
  })

  const filtered = statusFilter === 'all'
    ? records
    : records.filter((r) => r.status === statusFilter)

  return { data: filtered }
})
