import { db } from '~~/server/db'
import { announcements } from '~~/server/db/schema/announcement'
import { user } from '~~/server/db/schema/auth'
import { eq, and, sql } from 'drizzle-orm'
import type { Announcement } from '~~/shared/types/announcement'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de anuncio requerido' })
  }

  const userRole = session.user.role ?? ''
  const isPrivileged = userRole === 'admin' || userRole === 'conserje'

  // Build conditions
  const conditions = [
    eq(announcements.id, id),
    eq(announcements.tenantId, session.tenantId),
  ]

  // Non-privileged users only see published + not expired
  if (!isPrivileged) {
    conditions.push(eq(announcements.status, 'published'))
    conditions.push(
      sql`(${announcements.expiresAt} IS NULL OR ${announcements.expiresAt} >= NOW())`,
    )
  }

  const [row] = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      category: announcements.category,
      status: announcements.status,
      attachmentPath: announcements.attachmentPath,
      authorId: announcements.authorId,
      tenantId: announcements.tenantId,
      publishedAt: announcements.publishedAt,
      expiresAt: announcements.expiresAt,
      createdAt: announcements.createdAt,
      updatedAt: announcements.updatedAt,
      displayOrder: announcements.displayOrder,
      authorName: user.name,
    })
    .from(announcements)
    .leftJoin(user, eq(announcements.authorId, user.id))
    .where(and(...conditions))

  if (!row) {
    throw createError({ statusCode: 404, message: 'Anuncio no encontrado' })
  }

  const data: Announcement = {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    status: row.status,
    attachmentPath: row.attachmentPath,
    authorId: row.authorId,
    authorName: row.authorName ?? undefined,
    tenantId: row.tenantId,
    displayOrder: row.displayOrder,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }

  return { data }
})
