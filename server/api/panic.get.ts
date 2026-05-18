import { db } from '~~/server/db'
import { panicEvents } from '~~/server/db/schema/panic'
import { user } from '~~/server/db/schema/auth'
import { units } from '~~/server/db/schema/unit'
import { chatRooms } from '~~/server/db/schema/chat'
import { eq, desc, and } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin', 'vigilancia'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string | undefined

  if (!tenantId) {
    throw createError({ statusCode: 403, message: 'Usuario sin tenant asignado' })
  }

  const resolver = alias(user, 'resolver')

  const logs = await db
    .select({
      id: panicEvents.id,
      createdAt: panicEvents.createdAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
      userPhone: user.phone,
      unitNumber: units.number,
      unitLabel: units.label,
      resolvedAt: panicEvents.resolvedAt,
      resolvedNote: panicEvents.resolvedNote,
      resolverName: resolver.name,
    })
    .from(panicEvents)
    .innerJoin(user, eq(user.id, panicEvents.userId))
    .leftJoin(units, eq(units.id, panicEvents.unitId))
    .leftJoin(resolver, eq(resolver.id, panicEvents.resolvedBy))
    .where(eq(panicEvents.tenantId, tenantId))
    .orderBy(desc(panicEvents.createdAt))
    .limit(50)

  // Collect unique unitIds to batch-fetch chat room IDs
  const unitIds = [...new Set(logs.map(l => l.unitNumber).filter(Boolean))]
  const unitChatMap = new Map<string, string>()

  if (unitIds.length > 0) {
    // Get all unit-type chat rooms for this tenant
    const rooms = await db.select({ id: chatRooms.id, unitId: chatRooms.unitId })
      .from(chatRooms)
      .where(and(eq(chatRooms.tenantId, tenantId), eq(chatRooms.type, 'unit')))

    for (const r of rooms) {
      if (r.unitId) unitChatMap.set(r.unitId, r.id)
    }
  }

  // We need the actual unitId from panicEvents to map to chatRoomId
  // Re-query just the unitId field since we didn't select it above
  const panicUnitIds = await db.select({ id: panicEvents.id, unitId: panicEvents.unitId })
    .from(panicEvents)
    .where(eq(panicEvents.tenantId, tenantId))
    .orderBy(desc(panicEvents.createdAt))
    .limit(50)

  const panicUnitMap = new Map<string, string | null>()
  for (const p of panicUnitIds) {
    panicUnitMap.set(p.id, p.unitId)
  }

  const data = logs.map(log => {
    const unitId = panicUnitMap.get(log.id)
    return {
      id: log.id,
      createdAt: log.createdAt.toISOString(),
      userName: log.userName,
      userEmail: log.userEmail,
      userImage: log.userImage,
      userPhone: log.userPhone,
      unitNumber: log.unitNumber,
      unitLabel: log.unitLabel,
      chatRoomId: unitId ? (unitChatMap.get(unitId) ?? null) : null,
      resolvedAt: log.resolvedAt?.toISOString() ?? null,
      resolvedNote: log.resolvedNote,
      resolverName: log.resolverName,
    }
  })

  return { data }
})
