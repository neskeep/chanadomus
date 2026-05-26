import { db } from '~~/server/db'
import { chatRooms, chatRoomMembers } from '~~/server/db/schema/chat'
import { user } from '~~/server/db/schema/auth'
import { units } from '~~/server/db/schema/unit'
import { staff } from '~~/server/db/schema/staff'
import { eq, and, ne, inArray } from 'drizzle-orm'
import { requireTenant } from '~~/server/utils/auth'
import type { ChatContact } from '~~/shared/types/chat'

export default defineEventHandler(async (event) => {
  const { user: authUser, tenantId } = await requireTenant(event)
  const role = authUser.role ?? 'propietario'

  // Fetch all users in the same tenant, excluding self and banned
  const allUsers = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      role: user.role,
      unitId: user.unitId,
    })
    .from(user)
    .where(
      and(
        eq(user.tenantId, tenantId),
        ne(user.id, authUser.id),
        eq(user.banned, false),
      ),
    )

  // Filter by role visibility
  const allowedRoles = getRoleVisibility(role)
  let visibleUsers = allUsers.filter(u => allowedRoles.includes(u.role ?? 'propietario'))

  // Conserje: restrict propietarios to only those in the same ranch
  if (role === 'conserje') {
    const [staffRecord] = await db
      .select({ unitId: staff.unitId })
      .from(staff)
      .where(
        and(
          eq(staff.userId, authUser.id),
          eq(staff.tenantId, tenantId),
          eq(staff.isActive, true),
        ),
      )
      .limit(1)

    const conserjeUnitId = staffRecord?.unitId
    if (conserjeUnitId) {
      visibleUsers = visibleUsers.filter(u => {
        if ((u.role ?? 'propietario') === 'propietario') {
          return u.unitId === conserjeUnitId
        }
        return true // admin, vigilancia, conserje pass through
      })
    }
    else {
      // No unit assigned — hide all propietarios
      visibleUsers = visibleUsers.filter(u => (u.role ?? 'propietario') !== 'propietario')
    }
  }

  // Fetch unit labels for users with unitId
  const unitIds = [...new Set(visibleUsers.map(u => u.unitId).filter((id): id is string => !!id))]
  const unitMap = new Map<string, string>()

  if (unitIds.length > 0) {
    const unitRows = await db
      .select({ id: units.id, label: units.label, number: units.number })
      .from(units)
      .where(inArray(units.id, unitIds))

    for (const u of unitRows) {
      unitMap.set(u.id, u.label || u.number)
    }
  }

  // Find existing DM rooms for the current user
  const myMemberships = await db
    .select({ roomId: chatRoomMembers.roomId })
    .from(chatRoomMembers)
    .where(eq(chatRoomMembers.userId, authUser.id))

  const existingDmMap = new Map<string, string>() // contactUserId -> roomId

  if (myMemberships.length > 0) {
    const myRoomIds = myMemberships.map(m => m.roomId)

    // Verify these are direct rooms
    const directRoomRows = await db
      .select({ id: chatRooms.id })
      .from(chatRooms)
      .where(
        and(
          inArray(chatRooms.id, myRoomIds),
          eq(chatRooms.type, 'direct'),
        ),
      )

    const directRoomIds = directRoomRows.map(r => r.id)

    if (directRoomIds.length > 0) {
      // Get other members in those direct rooms
      const otherMemberships = await db
        .select({ roomId: chatRoomMembers.roomId, userId: chatRoomMembers.userId })
        .from(chatRoomMembers)
        .where(
          and(
            inArray(chatRoomMembers.roomId, directRoomIds),
            ne(chatRoomMembers.userId, authUser.id),
          ),
        )

      for (const m of otherMemberships) {
        existingDmMap.set(m.userId, m.roomId)
      }
    }
  }

  // Build contacts list
  const contacts: ChatContact[] = visibleUsers
    .map(u => ({
      id: u.id,
      name: u.name,
      image: u.image,
      role: u.role ?? 'propietario',
      unitLabel: u.unitId ? (unitMap.get(u.unitId) ?? null) : null,
      existingRoomId: existingDmMap.get(u.id) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return { data: contacts }
})

function getRoleVisibility(role: string): string[] {
  switch (role) {
    case 'admin':
      return ['admin', 'propietario', 'conserje', 'vigilancia']
    case 'propietario':
      return ['propietario', 'conserje', 'vigilancia', 'admin']
    case 'conserje':
      return ['propietario', 'admin', 'vigilancia', 'conserje']
    case 'vigilancia':
      return ['propietario', 'conserje', 'admin']
    default:
      return []
  }
}
