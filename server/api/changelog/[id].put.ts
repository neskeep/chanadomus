import { db } from '~~/server/db'
import { changelogEntries } from '~~/server/db/schema/support'
import { user } from '~~/server/db/schema/auth'
import { eq, and } from 'drizzle-orm'
import { CHANGELOG_ITEM_TYPES } from '~~/shared/types/changelog'
import type { ChangelogEntry, ChangelogItem } from '~~/shared/types/changelog'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireSuperAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de entrada requerido' })
  }

  const body = await readBody(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Datos invalidos' })
  }

  // Check existence and tenant scope
  const [current] = await db
    .select()
    .from(changelogEntries)
    .where(and(
      eq(changelogEntries.id, id),
      eq(changelogEntries.tenantId, session.tenantId),
    ))

  if (!current) {
    throw createError({ statusCode: 404, message: 'Entrada de changelog no encontrada' })
  }

  // Build update values
  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  // Validate version
  if (body.version !== undefined) {
    if (typeof body.version !== 'string' || !body.version.trim()) {
      throw createError({ statusCode: 400, message: 'La version es requerida' })
    }
    updateValues.version = body.version.trim()
  }

  // Validate title
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      throw createError({ statusCode: 400, message: 'El titulo es requerido' })
    }
    if (body.title.length > 200) {
      throw createError({ statusCode: 400, message: 'El titulo no puede exceder 200 caracteres' })
    }
    updateValues.title = body.title.trim()
  }

  // Validate changes
  if (body.changes !== undefined) {
    if (!Array.isArray(body.changes) || body.changes.length === 0) {
      throw createError({ statusCode: 400, message: 'Se requiere al menos un cambio' })
    }
    for (const item of body.changes) {
      if (!item || typeof item !== 'object') {
        throw createError({ statusCode: 400, message: 'Cada cambio debe ser un objeto valido' })
      }
      if (!CHANGELOG_ITEM_TYPES.includes(item.type)) {
        throw createError({ statusCode: 400, message: `Tipo de cambio invalido: ${item.type}. Valores permitidos: ${CHANGELOG_ITEM_TYPES.join(', ')}` })
      }
      if (!item.description || typeof item.description !== 'string' || !item.description.trim()) {
        throw createError({ statusCode: 400, message: 'Cada cambio requiere una descripcion' })
      }
    }
    updateValues.changes = body.changes.map((item: { type: string; description: string }) => ({
      type: item.type,
      description: item.description.trim(),
    }))
  }

  // Validate publishedAt
  if (body.publishedAt !== undefined) {
    if (typeof body.publishedAt !== 'string') {
      throw createError({ statusCode: 400, message: 'La fecha de publicacion debe ser una cadena ISO' })
    }
    const publishedAtDate = new Date(body.publishedAt)
    if (isNaN(publishedAtDate.getTime())) {
      throw createError({ statusCode: 400, message: 'Fecha de publicacion invalida' })
    }
    updateValues.publishedAt = publishedAtDate
  }

  // Update
  const updatedRows = await db
    .update(changelogEntries)
    .set(updateValues)
    .where(eq(changelogEntries.id, id))
    .returning()

  const updated = updatedRows[0]
  if (!updated) {
    throw createError({ statusCode: 500, message: 'Error al actualizar la entrada de changelog' })
  }

  // Get author name
  const [author] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, updated.createdById))

  const data: ChangelogEntry = {
    id: updated.id,
    version: updated.version,
    title: updated.title,
    changes: updated.changes as ChangelogItem[],
    publishedAt: updated.publishedAt.toISOString(),
    createdById: updated.createdById,
    createdByName: author?.name ?? undefined,
    tenantId: updated.tenantId,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }

  return { data }
})
