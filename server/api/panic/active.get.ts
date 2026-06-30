import { eq, and, isNull, gt, desc } from 'drizzle-orm'
import { db } from '~~/server/db'
import { panicEvents } from '~~/server/db/schema/panic'
import { user } from '~~/server/db/schema/auth'
import { units } from '~~/server/db/schema/unit'
import { chatRooms } from '~~/server/db/schema/chat'

/**
 * Lightweight endpoint for polling fallback — returns only unresolved alerts
 * from the last 30 minutes. Used when WebSocket connection fails.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin', 'vigilancia'])
  const { tenantId } = await requireTenant(event)

  const cutoff = new Date(Date.now() - 30 * 60 * 1000)

  const rows = await db
    .select({
      id: panicEvents.id,
      userId: panicEvents.userId,
      unitId: panicEvents.unitId,
      createdAt: panicEvents.createdAt,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      userImage: user.image,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(panicEvents)
    .innerJoin(user, eq(user.id, panicEvents.userId))
    .leftJoin(units, eq(units.id, panicEvents.unitId))
    .where(and(
      eq(panicEvents.tenantId, tenantId),
      isNull(panicEvents.resolvedAt),
      gt(panicEvents.createdAt, cutoff),
    ))
    .orderBy(desc(panicEvents.createdAt))
    .limit(5)

  // Batch-fetch chat room IDs for matched units
  const unitIds = [...new Set(rows.map(r => r.unitId).filter(Boolean))] as string[]
  const unitChatMap = new Map<string, string>()

  if (unitIds.length > 0) {
    const rooms = await db
      .select({ id: chatRooms.id, unitId: chatRooms.unitId })
      .from(chatRooms)
      .where(and(eq(chatRooms.tenantId, tenantId), eq(chatRooms.type, 'unit')))

    for (const r of rooms) {
      if (r.unitId) unitChatMap.set(r.unitId, r.id)
    }
  }

  const data = rows.map(row => ({
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
    userName: row.userName,
    userEmail: row.userEmail,
    userPhone: row.userPhone,
    userImage: row.userImage,
    unitNumber: row.unitNumber,
    unitLabel: row.unitLabel,
    chatRoomId: row.unitId ? (unitChatMap.get(row.unitId) ?? null) : null,
  }))

  return { data }
})
