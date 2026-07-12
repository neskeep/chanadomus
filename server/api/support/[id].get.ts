import { db } from '~~/server/db'
import { supportTickets, supportTicketScreenshots, supportTicketUpdates } from '~~/server/db/schema/support'
import { user } from '~~/server/db/schema/auth'
import { eq, and, asc } from 'drizzle-orm'
import type { SupportTicket, SupportTicketScreenshot, SupportTicketUpdate } from '~~/shared/types/support'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de ticket requerido' })
  }

  // Get ticket with joins
  const [row] = await db
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
    .where(and(
      eq(supportTickets.id, id),
      eq(supportTickets.tenantId, session.tenantId),
    ))

  if (!row) {
    throw createError({ statusCode: 404, message: 'Ticket no encontrado' })
  }

  // Non-admin can only view their own tickets
  const userRole = session.user.role ?? ''
  const isAdmin = userRole === 'admin'
  if (!isAdmin && row.reportedById !== session.user.id) {
    throw createError({ statusCode: 403, message: 'No tienes permiso para ver este ticket' })
  }

  // Get screenshots
  const screenshotRows = await db
    .select()
    .from(supportTicketScreenshots)
    .where(eq(supportTicketScreenshots.ticketId, id))

  const screenshots: SupportTicketScreenshot[] = screenshotRows.map((s) => ({
    id: s.id,
    ticketId: s.ticketId,
    filePath: s.filePath,
    createdAt: s.createdAt.toISOString(),
  }))

  // Get updates with user name join
  const updateRows = await db
    .select({
      id: supportTicketUpdates.id,
      ticketId: supportTicketUpdates.ticketId,
      oldStatus: supportTicketUpdates.oldStatus,
      newStatus: supportTicketUpdates.newStatus,
      note: supportTicketUpdates.note,
      updatedById: supportTicketUpdates.updatedById,
      createdAt: supportTicketUpdates.createdAt,
      updatedByName: user.name,
    })
    .from(supportTicketUpdates)
    .leftJoin(user, eq(supportTicketUpdates.updatedById, user.id))
    .where(eq(supportTicketUpdates.ticketId, id))
    .orderBy(asc(supportTicketUpdates.createdAt))

  const updates: SupportTicketUpdate[] = updateRows.map((u) => ({
    id: u.id,
    ticketId: u.ticketId,
    oldStatus: u.oldStatus,
    newStatus: u.newStatus,
    note: u.note,
    updatedById: u.updatedById,
    updatedByName: u.updatedByName ?? undefined,
    createdAt: u.createdAt.toISOString(),
  }))

  const ticket: SupportTicket = {
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
    screenshots,
    updates,
  }

  return { data: ticket }
})
