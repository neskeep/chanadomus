import { db } from '~~/server/db'
import { invitations } from '~~/server/db/schema/invitation'
import { units } from '~~/server/db/schema/unit'
import { eq } from 'drizzle-orm'
import type { InvitationLookup, InvitationStatus } from '~~/shared/types/invitation'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    return { data: { status: 'invalid' } satisfies InvitationLookup }
  }

  const [result] = await db
    .select({
      expiresAt: invitations.expiresAt,
      usedAt: invitations.usedAt,
      revokedAt: invitations.revokedAt,
      role: invitations.role,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(invitations)
    .innerJoin(units, eq(invitations.unitId, units.id))
    .where(eq(invitations.token, token))

  if (!result) {
    return { data: { status: 'invalid' } satisfies InvitationLookup }
  }

  let status: InvitationStatus
  if (result.revokedAt) {
    status = 'revoked'
  } else if (result.usedAt) {
    status = 'used'
  } else if (result.expiresAt < new Date()) {
    status = 'expired'
  } else {
    status = 'pending'
  }

  return {
    data: {
      status,
      unitNumber: result.unitNumber,
      unitLabel: result.unitLabel,
      role: result.role as 'propietario' | 'conserje',
      expiresAt: result.expiresAt.toISOString(),
    } satisfies InvitationLookup,
  }
})
