import { db } from '~~/server/db'
import { providers, providerReviews } from '~~/server/db/schema/provider'
import { user } from '~~/server/db/schema/auth'
import { eq, and, desc, count, avg } from 'drizzle-orm'
import type { Provider, ProviderReview } from '~~/shared/types/provider'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID del proveedor es requerido' })
  }

  // Get provider with creator name
  const rows = await db
    .select({
      id: providers.id,
      name: providers.name,
      phone: providers.phone,
      photo: providers.photo,
      schedule: providers.schedule,
      address: providers.address,
      services: providers.services,
      costs: providers.costs,
      notes: providers.notes,
      category: providers.category,
      status: providers.status,
      createdById: providers.createdById,
      tenantId: providers.tenantId,
      createdAt: providers.createdAt,
      updatedAt: providers.updatedAt,
      createdByName: user.name,
    })
    .from(providers)
    .leftJoin(user, eq(providers.createdById, user.id))
    .where(and(eq(providers.id, id), eq(providers.tenantId, session.tenantId)))

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 404, message: 'Proveedor no encontrado' })
  }

  // Non-privileged users can only see active providers
  const userRole = session.user.role ?? ''
  const isPrivileged = userRole === 'admin' || userRole === 'conserje'
  if (!isPrivileged && row.status !== 'active') {
    throw createError({ statusCode: 404, message: 'Proveedor no encontrado' })
  }

  // Get reviews with reviewer name
  const reviewRows = await db
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

  const reviews: ProviderReview[] = reviewRows.map((r) => ({
    id: r.id,
    providerId: r.providerId,
    rating: r.rating,
    comment: r.comment,
    reviewerId: r.reviewerId,
    reviewerName: r.reviewerName ?? undefined,
    tenantId: r.tenantId,
    createdAt: r.createdAt.toISOString(),
  }))

  // Calculate average rating
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0

  const data: Provider = {
    id: row.id,
    name: row.name,
    phone: row.phone,
    photo: row.photo,
    schedule: row.schedule,
    address: row.address,
    services: row.services,
    costs: row.costs,
    notes: row.notes,
    category: row.category,
    status: row.status,
    createdById: row.createdById,
    createdByName: row.createdByName ?? undefined,
    tenantId: row.tenantId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: reviews.length,
    reviews,
  }

  return { data }
})
