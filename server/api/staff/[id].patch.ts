import { db } from '~~/server/db'
import { staff } from '~~/server/db/schema/staff'
import { eq, and } from 'drizzle-orm'

const VALID_ROLES = ['conserje', 'vigilancia', 'mantenimiento', 'otro'] as const

interface StaffUpdateBody {
  name?: string
  role?: string
  idDocument?: string
  phone?: string
  email?: string
  shift?: string
  userId?: string
  unitId?: string | null
}

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  const body = await readBody<StaffUpdateBody>(event)

  if (body.role && !VALID_ROLES.includes(body.role as (typeof VALID_ROLES)[number])) {
    throw createError({ statusCode: 400, message: 'Rol invalido. Debe ser: conserje, vigilancia, mantenimiento u otro' })
  }

  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.role !== undefined) updates.role = body.role as (typeof VALID_ROLES)[number]
  if (body.idDocument !== undefined) updates.idDocument = body.idDocument?.trim() || null
  if (body.phone !== undefined) updates.phone = body.phone?.trim() || null
  if (body.email !== undefined) updates.email = body.email?.trim() || null
  if (body.shift !== undefined) updates.shift = body.shift?.trim() || null
  if (body.userId !== undefined) updates.userId = body.userId || null
  if (body.unitId !== undefined) updates.unitId = body.unitId || null

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No se proporcionaron campos para actualizar' })
  }

  const [updated] = await db
    .update(staff)
    .set(updates)
    .where(and(eq(staff.id, id), eq(staff.tenantId, tenantId)))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Personal no encontrado' })
  }

  return { data: updated }
})
