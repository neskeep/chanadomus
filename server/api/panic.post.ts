import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { panicEvents } from '~~/server/db/schema/panic'
import { user as userTable } from '~~/server/db/schema/auth'
import { units } from '~~/server/db/schema/unit'
import { chatRooms } from '~~/server/db/schema/chat'
import { sendPushToRole } from '~~/server/utils/web-push'
import { broadcastPanicAlert } from '~~/server/utils/ws-panic'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const unitId = (session.user as Record<string, unknown>).unitId as string | undefined

  // 1. Registrar evento de panico
  const [panicEvent] = await db.insert(panicEvents)
    .values({
      userId: session.user.id,
      unitId: unitId ?? null,
      tenantId: session.tenantId,
    })
    .returning({ id: panicEvents.id, createdAt: panicEvents.createdAt })

  // 2. Push a todos los de rol vigilancia
  const userName = session.user.name || session.user.email
  const pushResult = await sendPushToRole(session.tenantId, 'vigilancia', {
    title: 'ALERTA DE PANICO',
    body: `${userName} ha activado el boton de panico`,
    url: '/vigilancia/alertas',
    category: 'panico',
  })

  // 3. Get user info (phone, image) for broadcast
  const userInfo = await db.select({ phone: userTable.phone, image: userTable.image })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1)

  // 4. Get unit info + chat room for WebSocket broadcast
  let unitNumber: string | null = null
  let unitLabel: string | null = null
  let chatRoomId: string | null = null
  if (unitId) {
    const unitData = await db.select({ number: units.number, label: units.label })
      .from(units)
      .where(eq(units.id, unitId))
      .limit(1)
    if (unitData[0]) {
      unitNumber = unitData[0].number
      unitLabel = unitData[0].label
    }
    // Find the unit's chat room
    const room = await db.select({ id: chatRooms.id })
      .from(chatRooms)
      .where(and(eq(chatRooms.unitId, unitId), eq(chatRooms.type, 'unit')))
      .limit(1)
    chatRoomId = room[0]?.id ?? null
  }

  // 5. Broadcast via WebSocket to connected vigilancia clients
  broadcastPanicAlert({
    id: panicEvent!.id,
    createdAt: panicEvent!.createdAt.toISOString(),
    userName: userName as string,
    userEmail: session.user.email,
    userPhone: userInfo[0]?.phone ?? null,
    userImage: userInfo[0]?.image ?? null,
    unitNumber,
    unitLabel,
    chatRoomId,
  })

  return {
    data: {
      id: panicEvent!.id,
      createdAt: panicEvent!.createdAt.toISOString(),
      pushSent: pushResult.sent,
    },
  }
})
