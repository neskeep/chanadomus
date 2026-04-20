import { db } from '~~/server/db'
import { providers, providerReviews } from '~~/server/db/schema/provider'
import { eq, and } from 'drizzle-orm'
import type { ProviderReview, CreateReview } from '~~/shared/types/provider'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['propietario'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID del proveedor es requerido' })
  }

  // Verify provider exists, belongs to tenant, and is active
  const [existing] = await db
    .select({ id: providers.id, status: providers.status })
    .from(providers)
    .where(and(eq(providers.id, id), eq(providers.tenantId, session.tenantId)))

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Proveedor no encontrado' })
  }
  if (existing.status !== 'active') {
    throw createError({ statusCode: 400, message: 'Solo se pueden evaluar proveedores activos' })
  }

  const body = await readBody<CreateReview>(event)

  // Validate rating
  if (body.rating === undefined || body.rating === null) {
    throw createError({ statusCode: 400, message: 'La calificacion es requerida' })
  }
  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
    throw createError({ statusCode: 400, message: 'La calificacion debe ser un numero entero entre 1 y 5' })
  }

  // Validate comment
  if (body.comment && body.comment.length > 1000) {
    throw createError({ statusCode: 400, message: 'El comentario no puede exceder 1000 caracteres' })
  }

  // Check if user already reviewed this provider
  const [existingReview] = await db
    .select({ id: providerReviews.id })
    .from(providerReviews)
    .where(and(
      eq(providerReviews.providerId, id),
      eq(providerReviews.reviewerId, session.user.id),
    ))

  if (existingReview) {
    throw createError({ statusCode: 409, message: 'Ya has evaluado este proveedor' })
  }

  const rows = await db
    .insert(providerReviews)
    .values({
      providerId: id,
      rating: body.rating,
      comment: body.comment?.trim() || null,
      reviewerId: session.user.id,
      tenantId: session.tenantId,
    })
    .returning()

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 500, message: 'Error al crear la evaluacion' })
  }

  const data: ProviderReview = {
    id: row.id,
    providerId: row.providerId,
    rating: row.rating,
    comment: row.comment,
    reviewerId: row.reviewerId,
    tenantId: row.tenantId,
    createdAt: row.createdAt.toISOString(),
  }

  return { data }
})
