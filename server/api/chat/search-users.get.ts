import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { eq, ilike, and, ne, asc, or, isNull } from 'drizzle-orm'
import { requireTenant } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { user: authUser, tenantId } = await requireTenant(event)

  const query = getQuery(event)
  const q = typeof query.q === 'string' ? query.q.trim() : ''

  if (q.length < 1) {
    return { data: [] }
  }

  const results = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      role: user.role,
    })
    .from(user)
    .where(
      and(
        eq(user.tenantId, tenantId),
        ilike(user.name, `%${q}%`),
        or(eq(user.banned, false), isNull(user.banned)),
        ne(user.id, authUser.id),
      ),
    )
    .orderBy(asc(user.name))
    .limit(10)

  return { data: results }
})
