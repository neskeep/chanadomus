import { db } from '~~/server/db'
import { announcements } from '~~/server/db/schema/announcement'
import { user } from '~~/server/db/schema/auth'
import { eq, and } from 'drizzle-orm'
import { sendPushToAll } from '~~/server/utils/web-push'
import type { Announcement, AnnouncementCategory, AnnouncementStatus } from '~~/shared/types/announcement'

const VALID_CATEGORIES: AnnouncementCategory[] = ['general', 'mantenimiento', 'seguridad', 'financiero', 'evento', 'urgente']
const VALID_STATUSES: AnnouncementStatus[] = ['draft', 'published', 'archived']

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de anuncio requerido' })
  }

  const body = await readBody(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Datos invalidos' })
  }

  // Get current announcement
  const [current] = await db
    .select()
    .from(announcements)
    .where(and(
      eq(announcements.id, id),
      eq(announcements.tenantId, session.tenantId),
    ))

  if (!current) {
    throw createError({ statusCode: 404, message: 'Anuncio no encontrado' })
  }

  // Build update values
  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      throw createError({ statusCode: 400, message: 'El titulo es requerido' })
    }
    if (body.title.length > 200) {
      throw createError({ statusCode: 400, message: 'El titulo no puede exceder 200 caracteres' })
    }
    updateValues.title = body.title.trim()
  }

  if (body.body !== undefined) {
    if (typeof body.body !== 'string' || !body.body.trim()) {
      throw createError({ statusCode: 400, message: 'El contenido es requerido' })
    }
    updateValues.body = body.body.trim()
  }

  if (body.category !== undefined) {
    if (!VALID_CATEGORIES.includes(body.category as AnnouncementCategory)) {
      throw createError({ statusCode: 400, message: 'Categoria invalida' })
    }
    updateValues.category = body.category
  }

  if (body.displayOrder !== undefined) {
    const order = Number(body.displayOrder)
    if (!Number.isInteger(order) || order < 0) {
      throw createError({ statusCode: 400, message: 'displayOrder debe ser un entero >= 0' })
    }
    updateValues.displayOrder = order
  }

  if (body.expiresAt !== undefined) {
    if (body.expiresAt === null) {
      updateValues.expiresAt = null
    } else {
      const expiresAtDate = new Date(body.expiresAt as string)
      if (isNaN(expiresAtDate.getTime())) {
        throw createError({ statusCode: 400, message: 'Fecha de expiracion invalida' })
      }
      updateValues.expiresAt = expiresAtDate
    }
  }

  // Handle status change
  let shouldSendPush = false
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as AnnouncementStatus)) {
      throw createError({ statusCode: 400, message: 'Estado invalido' })
    }
    updateValues.status = body.status

    // If transitioning to published for the first time, set publishedAt and send push
    if (body.status === 'published' && current.status !== 'published') {
      updateValues.publishedAt = new Date()
      shouldSendPush = true
    }
  }

  const updatedRows = await db
    .update(announcements)
    .set(updateValues)
    .where(eq(announcements.id, id))
    .returning()

  const updated = updatedRows[0]
  if (!updated) {
    throw createError({ statusCode: 500, message: 'Error al actualizar el anuncio' })
  }

  // Send push notification if just published
  if (shouldSendPush) {
    await sendPushToAll(session.tenantId, {
      title: 'Nuevo anuncio',
      body: updated.title,
      url: '/mi-chana/cartelera',
      category: 'announcement',
    }).catch(() => {
      // Push failure should not block the response
    })
  }

  // Get author name
  const [author] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, updated.authorId))

  const data: Announcement = {
    id: updated.id,
    title: updated.title,
    body: updated.body,
    category: updated.category,
    status: updated.status,
    attachmentPath: updated.attachmentPath,
    authorId: updated.authorId,
    authorName: author?.name ?? undefined,
    tenantId: updated.tenantId,
    displayOrder: updated.displayOrder,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
    expiresAt: updated.expiresAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }

  return { data }
})
