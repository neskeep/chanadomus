import { db } from '~~/server/db'
import { announcements } from '~~/server/db/schema/announcement'
import { user } from '~~/server/db/schema/auth'
import { eq, and, sql, desc, count, isNull, gte } from 'drizzle-orm'
import type { Announcement, AnnouncementCategory, AnnouncementStatus } from '~~/shared/types/announcement'

const VALID_CATEGORIES: AnnouncementCategory[] = ['general', 'mantenimiento', 'seguridad', 'financiero', 'evento', 'urgente']
const VALID_STATUSES: AnnouncementStatus[] = ['draft', 'published', 'archived']

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const query = getQuery(event)
  const category = query.category as string | undefined
  const status = query.status as string | undefined
  const page = Math.max(1, parseInt(query.page as string, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20))
  const offset = (page - 1) * limit

  // Validate filter values
  if (category && !VALID_CATEGORIES.includes(category as AnnouncementCategory)) {
    throw createError({ statusCode: 400, message: 'Categoria invalida' })
  }
  if (status && !VALID_STATUSES.includes(status as AnnouncementStatus)) {
    throw createError({ statusCode: 400, message: 'Estado invalido' })
  }

  // Build conditions
  const conditions = [eq(announcements.tenantId, session.tenantId)]

  const userRole = session.user.role ?? ''
  const isPrivileged = userRole === 'admin' || userRole === 'conserje'

  // Non-privileged users only see published + not expired
  if (!isPrivileged) {
    conditions.push(eq(announcements.status, 'published'))
    conditions.push(
      sql`(${announcements.expiresAt} IS NULL OR ${announcements.expiresAt} >= NOW())`,
    )
  }

  if (category) {
    conditions.push(eq(announcements.category, category as AnnouncementCategory))
  }
  if (status && isPrivileged) {
    conditions.push(eq(announcements.status, status as AnnouncementStatus))
  }

  const whereClause = and(...conditions)

  // Get total count
  const [totalRow] = await db
    .select({ total: count() })
    .from(announcements)
    .where(whereClause)

  const total = totalRow?.total ?? 0

  // Get paginated results with author join
  const rows = await db
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
      authorName: user.name,
    })
    .from(announcements)
    .leftJoin(user, eq(announcements.authorId, user.id))
    .where(whereClause)
    .orderBy(desc(announcements.publishedAt), desc(announcements.createdAt))
    .limit(limit)
    .offset(offset)

  const data: Announcement[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    status: row.status,
    attachmentPath: row.attachmentPath,
    authorId: row.authorId,
    authorName: row.authorName ?? undefined,
    tenantId: row.tenantId,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))

  return { data, meta: { total, page, limit } }
})
