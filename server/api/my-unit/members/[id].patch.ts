import { db } from '~~/server/db'
import { householdMembers } from '~~/server/db/schema/household'
import { eq, and } from 'drizzle-orm'

const VALID_RELATIONSHIPS = ['owner', 'spouse', 'child', 'tenant', 'other'] as const

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { tenantId } = session
  const unitId = (session.user as Record<string, unknown>).unitId as string

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
  }

  const memberId = getRouterParam(event, 'id')
  if (!memberId) {
    throw createError({ statusCode: 400, message: 'Member ID es requerido' })
  }

  const body = await readBody<{
    name?: string
    relationship?: string
    idDocument?: string | null
    phone?: string | null
  }>(event)

  if (body.relationship && !VALID_RELATIONSHIPS.includes(body.relationship as typeof VALID_RELATIONSHIPS[number])) {
    throw createError({ statusCode: 400, message: `La relación debe ser una de: ${VALID_RELATIONSHIPS.join(', ')}` })
  }

  if (body.name !== undefined && !body.name?.trim()) {
    throw createError({ statusCode: 400, message: 'El nombre no puede estar vacío' })
  }

  const updateData: Record<string, unknown> = {}
  if (body.name) updateData.name = body.name.trim()
  if (body.relationship) updateData.relationship = body.relationship
  if (body.idDocument !== undefined) updateData.idDocument = body.idDocument
  if (body.phone !== undefined) updateData.phone = body.phone

  if (Object.keys(updateData).length === 0) {
    throw createError({ statusCode: 400, message: 'No hay campos para actualizar' })
  }

  const [updated] = await db
    .update(householdMembers)
    .set(updateData)
    .where(
      and(
        eq(householdMembers.id, memberId),
        eq(householdMembers.unitId, unitId),
        eq(householdMembers.tenantId, tenantId),
      ),
    )
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Miembro no encontrado' })
  }

  return { data: updated }
})
