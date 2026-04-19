import { db } from '~~/server/db'
import { incidents, incidentUpdates } from '~~/server/db/schema/incident'
import { eq, and } from 'drizzle-orm'
import { sendPushToUser } from '~~/server/utils/web-push'
import type { IncidentStatus } from '~~/shared/types/incident'

const VALID_STATUSES: IncidentStatus[] = ['open', 'in_progress', 'resolved', 'closed']

const statusLabels: Record<IncidentStatus, string> = {
  open: 'Abierta',
  in_progress: 'En proceso',
  resolved: 'Resuelta',
  closed: 'Cerrada',
}

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de incidencia requerido' })
  }

  const body = await readBody(event)
  const { status, note } = body ?? {}

  // Validate status
  if (!status || !VALID_STATUSES.includes(status as IncidentStatus)) {
    throw createError({ statusCode: 400, message: 'Estado invalido. Debe ser: open, in_progress, resolved o closed' })
  }

  if (note !== undefined && note !== null && typeof note !== 'string') {
    throw createError({ statusCode: 400, message: 'La nota debe ser un string' })
  }

  // Get current incident
  const [current] = await db
    .select()
    .from(incidents)
    .where(and(
      eq(incidents.id, id),
      eq(incidents.tenantId, session.tenantId),
    ))

  if (!current) {
    throw createError({ statusCode: 404, message: 'Incidencia no encontrada' })
  }

  const newStatus = status as IncidentStatus

  // Insert update record
  await db.insert(incidentUpdates).values({
    incidentId: id,
    oldStatus: current.status,
    newStatus,
    note: note ?? null,
    updatedById: session.user.id,
  })

  // Update incident
  const now = new Date()
  const updateValues: Record<string, unknown> = {
    status: newStatus,
    updatedAt: now,
  }
  if (newStatus === 'resolved') {
    updateValues.resolvedAt = now
  }

  const updatedRows = await db
    .update(incidents)
    .set(updateValues)
    .where(eq(incidents.id, id))
    .returning()

  const updated = updatedRows[0]
  if (!updated) {
    throw createError({ statusCode: 500, message: 'Error al actualizar la incidencia' })
  }

  // Send push to the reporter
  await sendPushToUser(current.reportedById, {
    title: 'Incidencia actualizada',
    body: `Tu incidencia "${current.title}" cambio a: ${statusLabels[newStatus]}`,
    url: '/propietario/incidencias',
    category: 'incident_update',
  }).catch(() => {
    // Push failure should not block the response
  })

  return {
    data: {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      priority: updated.priority,
      status: updated.status,
      reportedById: updated.reportedById,
      unitId: updated.unitId,
      tenantId: updated.tenantId,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      resolvedAt: updated.resolvedAt?.toISOString() ?? null,
    },
  }
})
