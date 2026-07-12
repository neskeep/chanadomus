import { db } from '~~/server/db'
import { supportTickets } from '~~/server/db/schema/support'
import { user } from '~~/server/db/schema/auth'
import { eq, and, desc, count } from 'drizzle-orm'
import type { SupportTicket, SupportTicketStatus, SupportTicketType, SupportTicketPriority } from '~~/shared/types/support'
import { SUPPORT_TICKET_STATUSES, SUPPORT_TICKET_TYPES, SUPPORT_TICKET_PRIORITIES } from '~~/shared/types/support'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const query = getQuery(event)
  const status = query.status as string | undefined
  const type = query.type as string | undefined
  const priority = query.priority as string | undefined
  const page = Math.max(1, parseInt(query.page as string, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20))
  const offset = (page - 1) * limit

  // Validate filter values
  if (status && !SUPPORT_TICKET_STATUSES.includes(status as SupportTicketStatus)) {
    throw createError({ statusCode: 400, message: 'Estado invalido' })
  }
  if (type && !SUPPORT_TICKET_TYPES.includes(type as SupportTicketType)) {
    throw createError({ statusCode: 400, message: 'Tipo invalido' })
  }
  if (priority && !SUPPORT_TICKET_PRIORITIES.includes(priority as SupportTicketPriority)) {
    throw createError({ statusCode: 400, message: 'Prioridad invalida' })
  }

  // Build conditions
  const conditions = [eq(supportTickets.tenantId, session.tenantId)]

  const userRole = session.user.role ?? ''
  const isAdmin = userRole === 'admin'

  // Non-admin users can only see their own tickets
  if (!isAdmin) {
    conditions.push(eq(supportTickets.reportedById, session.user.id))
  }

  if (status) {
    conditions.push(eq(supportTickets.status, status as SupportTicketStatus))
  }
  if (type) {
    conditions.push(eq(supportTickets.type, type as SupportTicketType))
  }
  if (priority) {
    conditions.push(eq(supportTickets.priority, priority as SupportTicketPriority))
  }

  const whereClause = and(...conditions)

  // Get total count
  const [totalRow] = await db
    .select({ total: count() })
    .from(supportTickets)
    .where(whereClause)

  const total = totalRow?.total ?? 0

  // Get paginated results with joins
  const rows = await db
    .select({
      id: supportTickets.id,
      title: supportTickets.title,
      description: supportTickets.description,
      type: supportTickets.type,
      priority: supportTickets.priority,
      status: supportTickets.status,
      reportedById: supportTickets.reportedById,
      pageUrl: supportTickets.pageUrl,
      userAgent: supportTickets.userAgent,
      resolvedInVersion: supportTickets.resolvedInVersion,
      isPublic: supportTickets.isPublic,
      tenantId: supportTickets.tenantId,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
      resolvedAt: supportTickets.resolvedAt,
      reportedByName: user.name,
      reportedByRole: user.role,
    })
    .from(supportTickets)
    .leftJoin(user, eq(supportTickets.reportedById, user.id))
    .where(whereClause)
    .orderBy(desc(supportTickets.createdAt))
    .limit(limit)
    .offset(offset)

  const data: SupportTicket[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    priority: row.priority,
    status: row.status,
    reportedById: row.reportedById,
    reportedByName: row.reportedByName ?? undefined,
    reportedByRole: row.reportedByRole ?? undefined,
    pageUrl: row.pageUrl,
    userAgent: row.userAgent,
    resolvedInVersion: row.resolvedInVersion,
    isPublic: row.isPublic,
    tenantId: row.tenantId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  }))

  return { data, meta: { total, page, limit } }
})
