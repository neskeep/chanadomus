import { db } from '~~/server/db'
import { changelogEntries } from '~~/server/db/schema/support'
import { user } from '~~/server/db/schema/auth'
import { eq } from 'drizzle-orm'
import { CHANGELOG_ITEM_TYPES } from '~~/shared/types/changelog'
import type { ChangelogEntry, ChangelogItem } from '~~/shared/types/changelog'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const body = await readBody(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Datos invalidos' })
  }

  // Validate version
  if (!body.version || typeof body.version !== 'string' || !body.version.trim()) {
    throw createError({ statusCode: 400, message: 'La version es requerida' })
  }

  // Validate title
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    throw createError({ statusCode: 400, message: 'El titulo es requerido' })
  }
  if (body.title.length > 200) {
    throw createError({ statusCode: 400, message: 'El titulo no puede exceder 200 caracteres' })
  }

  // Validate changes
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

  // Validate publishedAt
  if (!body.publishedAt || typeof body.publishedAt !== 'string') {
    throw createError({ statusCode: 400, message: 'La fecha de publicacion es requerida' })
  }
  const publishedAtDate = new Date(body.publishedAt)
  if (isNaN(publishedAtDate.getTime())) {
    throw createError({ statusCode: 400, message: 'Fecha de publicacion invalida' })
  }

  // Sanitize changes
  const changes: ChangelogItem[] = body.changes.map((item: { type: string; description: string }) => ({
    type: item.type,
    description: item.description.trim(),
  }))

  // Insert
  const rows = await db
    .insert(changelogEntries)
    .values({
      version: body.version.trim(),
      title: body.title.trim(),
      changes,
      publishedAt: publishedAtDate,
      createdById: session.user.id,
      tenantId: session.tenantId,
    })
    .returning()

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 500, message: 'Error al crear la entrada de changelog' })
  }

  // Get author name
  const [author] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, row.createdById))

  const data: ChangelogEntry = {
    id: row.id,
    version: row.version,
    title: row.title,
    changes: row.changes as ChangelogItem[],
    publishedAt: row.publishedAt.toISOString(),
    createdById: row.createdById,
    createdByName: author?.name ?? undefined,
    tenantId: row.tenantId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }

  return { data }
})
