import { db } from '~~/server/db'
import { staff } from '~~/server/db/schema/staff'

const VALID_ROLES = ['conserje', 'vigilancia', 'mantenimiento', 'otro'] as const

interface StaffCreateBody {
  name: string
  role: string
  idDocument?: string
  phone?: string
  email?: string
  shift?: string
  userId?: string
}

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const body = await readBody<StaffCreateBody>(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, message: 'El nombre es requerido' })
  }
  if (!body.role || !VALID_ROLES.includes(body.role as (typeof VALID_ROLES)[number])) {
    throw createError({ statusCode: 400, message: 'Rol invalido. Debe ser: conserje, vigilancia, mantenimiento u otro' })
  }

  const [inserted] = await db
    .insert(staff)
    .values({
      name: body.name.trim(),
      role: body.role as (typeof VALID_ROLES)[number],
      idDocument: body.idDocument?.trim() || null,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      shift: body.shift?.trim() || null,
      userId: body.userId || null,
      tenantId,
    })
    .returning()

  setResponseStatus(event, 201)
  return { data: inserted }
})
