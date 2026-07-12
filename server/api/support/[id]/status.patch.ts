import { db } from '~~/server/db'
import { supportTickets, supportTicketUpdates } from '~~/server/db/schema/support'
import { eq, and } from 'drizzle-orm'
import { sendPushToUser } from '~~/server/utils/web-push'
import type { SupportTicketStatus } from '~~/shared/types/support'
import { SUPPORT_TICKET_STATUSES } from '~~/shared/types/support'

const statusLabels: Record<SupportTicketStatus, string> = {
  nuevo: 'Nuevo',
  en_revision: 'En revision',
  en_desarrollo: 'En desarrollo',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
}

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de ticket requerido' })
  }

  const body = await readBody(event)
  const { status, note, resolvedInVersion } = body ?? {}

  // Validate status
  if (!status || !SUPPORT_TICKET_STATUSES.includes(status as SupportTicketStatus)) {
    throw createError({ statusCode: 400, message: 'Estado invalido. Debe ser: nuevo, en_revision, en_desarrollo, resuelto o cerrado' })
  }

  if (note !== undefined && note !== null && typeof note !== 'string') {
    throw createError({ statusCode: 400, message: 'La nota debe ser un string' })
  }

  if (resolvedInVersion !== undefined && resolvedInVersion !== null && typeof resolvedInVersion !== 'string') {
    throw createError({ statusCode: 400, message: 'resolvedInVersion debe ser un string' })
  }

  // Get current ticket
  const [current] = await db
    .select()
    .from(supportTickets)
    .where(and(
      eq(supportTickets.id, id),
      eq(supportTickets.tenantId, session.tenantId),
    ))

  if (!current) {
    throw createError({ statusCode: 404, message: 'Ticket no encontrado' })
  }

  const newStatus = status as SupportTicketStatus

  // Insert update record
  await db.insert(supportTicketUpdates).values({
    ticketId: id,
    oldStatus: current.status,
    newStatus,
    note: note ?? null,
    updatedById: session.user.id,
  })

  // Update ticket
  const now = new Date()
  const updateValues: Record<string, unknown> = {
    status: newStatus,
    updatedAt: now,
  }
  if (newStatus === 'resuelto') {
    updateValues.resolvedAt = now
    if (resolvedInVersion) {
      updateValues.resolvedInVersion = resolvedInVersion
    }
  }

  const updatedRows = await db
    .update(supportTickets)
    .set(updateValues)
    .where(eq(supportTickets.id, id))
    .returning()

  const updated = updatedRows[0]
  if (!updated) {
    throw createError({ statusCode: 500, message: 'Error al actualizar el ticket' })
  }

  // Send push to the reporter
  await sendPushToUser(current.reportedById, {
    title: 'Ticket de soporte actualizado',
    body: `Tu ticket "${current.title}" cambio a: ${statusLabels[newStatus]}`,
    url: '/soporte',
    category: 'soporte_update',
  }).catch(() => {
    // Push failure should not block the response
  })

  return {
    data: {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      type: updated.type,
      priority: updated.priority,
      status: updated.status,
      reportedById: updated.reportedById,
      pageUrl: updated.pageUrl,
      userAgent: updated.userAgent,
      resolvedInVersion: updated.resolvedInVersion,
      isPublic: updated.isPublic,
      tenantId: updated.tenantId,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      resolvedAt: updated.resolvedAt?.toISOString() ?? null,
    },
  }
})
