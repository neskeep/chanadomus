import { db } from '~~/server/db'
import { providers, providerReviews } from '~~/server/db/schema/provider'
import { user } from '~~/server/db/schema/auth'
import { eq, and, desc, count } from 'drizzle-orm'
import type { ProviderReview } from '~~/shared/types/provider'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID del proveedor es requerido' })
  }

  // Verify provider exists and belongs to tenant
  const [existing] = await db
    .select({ id: providers.id, status: providers.status })
    .from(providers)
    .where(and(eq(providers.id, id), eq(providers.tenantId, session.tenantId)))

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Proveedor no encontrado' })
  }

  // Non-privileged users can only see reviews of active providers
  const userRole = session.user.role ?? ''
  const isPrivileged = userRole === 'admin' || userRole === 'conserje'
  if (!isPrivileged && existing.status !== 'active') {
    throw createError({ statusCode: 404, message: 'Proveedor no encontrado' })
  }

  const query = getQuery(event)
  const page = Math.max(1, parseInt(query.page as string, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20))
  const offset = (page - 1) * limit

  // Get total count
  const [totalRow] = await db
    .select({ total: count() })
    .from(providerReviews)
    .where(eq(providerReviews.providerId, id))

  const total = totalRow?.total ?? 0

  // Get paginated reviews with reviewer name
  const rows = await db
    .select({
      id: providerReviews.id,
      providerId: providerReviews.providerId,
      rating: providerReviews.rating,
      comment: providerReviews.comment,
      reviewerId: providerReviews.reviewerId,
      tenantId: providerReviews.tenantId,
      createdAt: providerReviews.createdAt,
      reviewerName: user.name,
    })
    .from(providerReviews)
    .leftJoin(user, eq(providerReviews.reviewerId, user.id))
    .where(eq(providerReviews.providerId, id))
    .orderBy(desc(providerReviews.createdAt))
    .limit(limit)
    .offset(offset)

  const data: ProviderReview[] = rows.map((r) => ({
    id: r.id,
    providerId: r.providerId,
    rating: r.rating,
    comment: r.comment,
    reviewerId: r.reviewerId,
    reviewerName: r.reviewerName ?? undefined,
    tenantId: r.tenantId,
    createdAt: r.createdAt.toISOString(),
  }))

  return { data, meta: { total, page, limit } }
})
