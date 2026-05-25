import { db } from '~~/server/db'
import { householdMembers } from '~~/server/db/schema/household'

const VALID_RELATIONSHIPS = ['owner', 'spouse', 'child', 'tenant', 'other'] as const

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
  const unitId = (session.user as Record<string, unknown>).unitId as string

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
  }

  const body = await readBody<{
    name?: string
    relationship?: string
    idDocument?: string
    phone?: string
  }>(event)

  if (!body.name || !body.name.trim()) {
    throw createError({ statusCode: 400, message: 'El nombre es requerido' })
  }

  if (!body.relationship || !VALID_RELATIONSHIPS.includes(body.relationship as typeof VALID_RELATIONSHIPS[number])) {
    throw createError({ statusCode: 400, message: `La relación debe ser una de: ${VALID_RELATIONSHIPS.join(', ')}` })
  }

  if (!body.idDocument || !body.idDocument.trim()) {
    throw createError({ statusCode: 400, message: 'El documento de identidad es requerido' })
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
