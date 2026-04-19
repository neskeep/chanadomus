import { db } from '~~/server/db'
import { chatRooms } from '~~/server/db/schema/chat'
import { eq, and, or, inArray, sql } from 'drizzle-orm'
import { requireTenant } from '~~/server/utils/auth'
import type { ChatRoomType } from '~~/shared/types/chat'

export default defineEventHandler(async (event) => {
  const { user, tenantId } = await requireTenant(event)
  const role = user.role ?? 'propietario'
  const unitId = (user as Record<string, unknown>).unitId as string | null

  // Admin gets all rooms for the tenant
  if (role === 'admin') {
    const rooms = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.tenantId, tenantId))

    return { data: rooms }
  }

  // Build accessible room types based on role
  const accessibleTypes: ChatRoomType[] = ['general']

  if (role === 'vigilancia' || role === 'conserje') {
    accessibleTypes.push('vigilancia')
  }

  // For non-unit room types (general, vigilancia, etc.)
  const conditions = [
    and(
      eq(chatRooms.tenantId, tenantId),
      inArray(chatRooms.type, accessibleTypes),
      sql`${chatRooms.unitId} IS NULL`,
    ),
  ]

  // Add unit room access for propietarios who have a unit assigned
  if (role === 'propietario' && unitId) {
    conditions.push(
      and(
        eq(chatRooms.tenantId, tenantId),
        eq(chatRooms.type, 'unit'),
        eq(chatRooms.unitId, unitId),
      ),
    )
  }

  const rooms = await db
    .select()
    .from(chatRooms)
    .where(or(...conditions))

  return { data: rooms }
})
