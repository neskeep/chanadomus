import { db } from '~~/server/db'
import { invitations } from '~~/server/db/schema/invitation'
import { units } from '~~/server/db/schema/unit'
import { eq, and } from 'drizzle-orm'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const body = await readBody(event)

  if (!body?.unitId || typeof body.unitId !== 'string') {
    throw createError({ statusCode: 400, message: 'unitId es requerido' })
  }

  const validRoles = ['propietario', 'conserje'] as const
  if (!body.role || !validRoles.includes(body.role)) {
    throw createError({ statusCode: 400, message: 'role debe ser "propietario" o "conserje"' })
  }

  // Validate unit exists and belongs to tenant
  const [unit] = await db
    .select({ id: units.id })
    .from(units)
    .where(and(eq(units.id, body.unitId), eq(units.tenantId, tenantId)))
    .limit(1)

  if (!unit) {
    throw createError({ statusCode: 404, message: 'Unidad no encontrada' })
  }

  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const [invitation] = await db
    .insert(invitations)
    .values({
      token,
      unitId: body.unitId,
      tenantId,
      role: body.role,
      createdById: session.user.id,
      expiresAt,
    })
    .returning({
      id: invitations.id,
      token: invitations.token,
      expiresAt: invitations.expiresAt,
    })

  setResponseStatus(event, 201)
  return { data: invitation }
})
