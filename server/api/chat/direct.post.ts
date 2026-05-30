import { db } from '~~/server/db'
import { chatRooms, chatRoomMembers } from '~~/server/db/schema/chat'
import { user } from '~~/server/db/schema/auth'
import { eq, and, inArray } from 'drizzle-orm'
import { requireTenant } from '~~/server/utils/auth'

interface DirectChatBody {
  targetUserId: string
}

export default defineEventHandler(async (event) => {
  const { user: authUser, tenantId } = await requireTenant(event)
  const body = await readBody<DirectChatBody>(event)

  if (!body.targetUserId || typeof body.targetUserId !== 'string') {
    throw createError({ statusCode: 400, message: 'targetUserId es requerido' })
  }

  if (body.targetUserId === authUser.id) {
    throw createError({ statusCode: 400, message: 'No puedes crear una conversación contigo mismo' })
  }

  // Verify target user exists in same tenant
  const [targetUser] = await db
    .select({ id: user.id, name: user.name, tenantId: user.tenantId })
    .from(user)
    .where(
      and(
        eq(user.id, body.targetUserId),
        eq(user.tenantId, tenantId),
      ),
    )

  if (!targetUser) {
    throw createError({ statusCode: 404, message: 'Usuario no encontrado' })
  }

  // Check if a direct room already exists between these two users
  const myRoomIds = await db
    .select({ roomId: chatRoomMembers.roomId })
    .from(chatRoomMembers)
    .where(eq(chatRoomMembers.userId, authUser.id))

  if (myRoomIds.length > 0) {
    const targetInMyRooms = await db
      .select({ roomId: chatRoomMembers.roomId })
      .from(chatRoomMembers)
      .innerJoin(chatRooms, eq(chatRooms.id, chatRoomMembers.roomId))
      .where(
        and(
          inArray(chatRoomMembers.roomId, myRoomIds.map(r => r.roomId)),
          eq(chatRoomMembers.userId, body.targetUserId),
          eq(chatRooms.type, 'direct'),
        ),
      )

    if (targetInMyRooms.length > 0 && targetInMyRooms[0]) {
      return { data: { roomId: targetInMyRooms[0].roomId } }
    }
  }

  // Create new direct room + members in a transaction
  const result = await db.transaction(async (tx) => {
    const [newRoom] = await tx
      .insert(chatRooms)
      .values({
        name: '',
        type: 'direct',
        tenantId,
      })
      .returning({ id: chatRooms.id })

    if (!newRoom) {
      throw createError({ statusCode: 500, message: 'Error al crear la conversación' })
    }

    await tx.insert(chatRoomMembers).values([
      { roomId: newRoom.id, userId: authUser.id },
      { roomId: newRoom.id, userId: body.targetUserId },
    ])

    return newRoom
  })

  return { data: { roomId: result.id } }
})
