import { db } from '~~/server/db'
import { units } from '~~/server/db/schema/unit'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Unit ID is required' })
  }

  const body = await readBody<{
    number?: string
    label?: string | null
    isActive?: boolean
  }>(event)

  const updates: Record<string, unknown> = {}

  if (body.number !== undefined) {
    if (!body.number.trim()) {
      throw createError({ statusCode: 400, message: 'Number cannot be empty' })
    }
    updates.number = body.number.trim()
  }

  if (body.label !== undefined) {
    updates.label = body.label
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') {
      throw createError({ statusCode: 400, message: 'isActive must be a boolean' })
    }
    updates.isActive = body.isActive
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No fields to update' })
  }

  updates.updatedAt = new Date()

  const [updated] = await db
    .update(units)
    .set(updates)
    .where(
      and(
        eq(units.id, id),
        eq(units.tenantId, tenantId),
      ),
    )
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Unit not found' })
  }

  return { data: updated }
})
