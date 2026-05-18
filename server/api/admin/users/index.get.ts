import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { units } from '~~/server/db/schema/unit'
import { eq, and, or, ilike, asc } from 'drizzle-orm'
import { USER_ROLES, type UserRole } from '~~/shared/types/auth'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const query = getQuery(event)
  const role = query.role as string | undefined
  const search = query.search as string | undefined

  if (role && !USER_ROLES.includes(role as UserRole)) {
    throw createError({ statusCode: 400, message: 'Rol invalido' })
  }

  const conditions = [eq(user.tenantId, tenantId)]

  if (role) {
    conditions.push(eq(user.role, role))
  }

  if (search?.trim()) {
    const term = `%${search.trim()}%`
    conditions.push(or(ilike(user.name, term), ilike(user.email, term))!)
  }

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      image: user.image,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      unitId: user.unitId,
      unitNumber: units.number,
      unitLabel: units.label,
      createdAt: user.createdAt,
    })
    .from(user)
    .leftJoin(units, eq(user.unitId, units.id))
    .where(and(...conditions))
    .orderBy(asc(user.name))

  return { data: rows }
})
