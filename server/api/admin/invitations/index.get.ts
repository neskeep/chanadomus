import { db } from '~~/server/db'
import { invitations } from '~~/server/db/schema/invitation'
import { units } from '~~/server/db/schema/unit'
import { eq, and, desc } from 'drizzle-orm'
import type { Invitation, InvitationStatus } from '~~/shared/types/invitation'

function computeStatus(row: { revokedAt: Date | null; usedAt: Date | null; expiresAt: Date }): InvitationStatus {
  if (row.revokedAt) return 'revoked'
  if (row.usedAt) return 'used'
  if (row.expiresAt < new Date()) return 'expired'
  return 'pending'
}

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const query = getQuery(event)
  const unitId = query.unitId as string | undefined

  const conditions = [eq(invitations.tenantId, tenantId)]
  if (unitId) {
    conditions.push(eq(invitations.unitId, unitId))
  }

  const rows = await db
    .select({
      id: invitations.id,
      token: invitations.token,
      unitId: invitations.unitId,
      unitNumber: units.number,
      unitLabel: units.label,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
      usedAt: invitations.usedAt,
      revokedAt: invitations.revokedAt,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .innerJoin(units, eq(invitations.unitId, units.id))
    .where(and(...conditions))
    .orderBy(desc(invitations.createdAt))

  const data: Invitation[] = rows.map((row) => ({
    id: row.id,
    token: row.token,
    unitId: row.unitId,
    unitNumber: row.unitNumber,
    unitLabel: row.unitLabel,
    role: row.role as Invitation['role'],
    expiresAt: row.expiresAt.toISOString(),
    usedAt: row.usedAt?.toISOString() ?? null,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    status: computeStatus(row),
  }))

  return { data }
})
