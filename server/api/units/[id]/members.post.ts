import { db } from '~~/server/db'
import { householdMembers } from '~~/server/db/schema/household'

const VALID_RELATIONSHIPS = ['owner', 'spouse', 'child', 'tenant', 'other'] as const

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const unitId = getRouterParam(event, 'id')
  if (!unitId) {
    throw createError({ statusCode: 400, message: 'Unit ID is required' })
  }

  const body = await readBody<{
    name?: string
    relationship?: string
    idDocument?: string
    phone?: string
  }>(event)

  if (!body.name || !body.name.trim()) {
    throw createError({ statusCode: 400, message: 'Name is required' })
  }

  if (!body.relationship || !VALID_RELATIONSHIPS.includes(body.relationship as typeof VALID_RELATIONSHIPS[number])) {
    throw createError({ statusCode: 400, message: `Relationship must be one of: ${VALID_RELATIONSHIPS.join(', ')}` })
  }

  const [inserted] = await db
    .insert(householdMembers)
    .values({
      unitId,
      name: body.name.trim(),
      relationship: body.relationship as typeof VALID_RELATIONSHIPS[number],
      idDocument: body.idDocument ?? null,
      phone: body.phone ?? null,
      tenantId,
    })
    .returning()

  setResponseStatus(event, 201)
  return { data: inserted }
})
