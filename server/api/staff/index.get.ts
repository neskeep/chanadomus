import { db } from '~~/server/db'
import { staff } from '~~/server/db/schema/staff'
import { eq, and, asc } from 'drizzle-orm'

const VALID_ROLES = ['conserje', 'vigilancia', 'mantenimiento', 'otro'] as const

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const query = getQuery(event)
  const role = query.role as string | undefined

  if (role && !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    throw createError({ statusCode: 400, message: 'Rol de staff invalido' })
  }

  const conditions = [
    eq(staff.tenantId, tenantId),
    eq(staff.isActive, true),
  ]

  if (role) {
    conditions.push(eq(staff.role, role as (typeof VALID_ROLES)[number]))
  }

  const rows = await db
    .select()
    .from(staff)
    .where(and(...conditions))
    .orderBy(asc(staff.name))

  return { data: rows }
})
