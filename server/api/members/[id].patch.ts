import { db } from '~~/server/db'
import { householdMembers } from '~~/server/db/schema/household'
import { eq, and } from 'drizzle-orm'

const VALID_RELATIONSHIPS = ['owner', 'spouse', 'child', 'tenant', 'other'] as const

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const memberId = getRouterParam(event, 'id')
  if (!memberId) {
    throw createError({ statusCode: 400, message: 'Member ID is required' })
  }

  const body = await readBody<{
    name?: string
    relationship?: string
    idDocument?: string
    phone?: string
  }>(event)

  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) {
    if (!body.name.trim()) {
      throw createError({ statusCode: 400, message: 'Name cannot be empty' })
    }
    updates.name = body.name.trim()
  }

  if (body.relationship !== undefined) {
    if (!VALID_RELATIONSHIPS.includes(body.relationship as typeof VALID_RELATIONSHIPS[number])) {
      throw createError({ statusCode: 400, message: `Relationship must be one of: ${VALID_RELATIONSHIPS.join(', ')}` })
    }
    updates.relationship = body.relationship
  }

  if (body.idDocument !== undefined) updates.idDocument = body.idDocument
  if (body.phone !== undefined) updates.phone = body.phone

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No fields to update' })
  }

  const [updated] = await db
    .update(householdMembers)
    .set(updates)
    .where(
      and(
        eq(householdMembers.id, memberId),
        eq(householdMembers.tenantId, tenantId),
      ),
    )
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Member not found' })
  }

  return { data: updated }
})
