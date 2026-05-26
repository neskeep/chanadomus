import { db } from '~~/server/db'
import { incidents, incidentPhotos, incidentUpdates } from '~~/server/db/schema/incident'
import { units } from '~~/server/db/schema/unit'
import { user } from '~~/server/db/schema/auth'
import { eq, and, asc } from 'drizzle-orm'
import type { Incident, IncidentPhoto, IncidentUpdate } from '~~/shared/types/incident'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de incidencia requerido' })
  }

  // Get incident with joins
  const [row] = await db
    .select({
      id: incidents.id,
      title: incidents.title,
      description: incidents.description,
      priority: incidents.priority,
      status: incidents.status,
      reportedById: incidents.reportedById,
      unitId: incidents.unitId,
      tenantId: incidents.tenantId,
      createdAt: incidents.createdAt,
      updatedAt: incidents.updatedAt,
      isAnonymous: incidents.isAnonymous,
      resolvedAt: incidents.resolvedAt,
      unitNumber: units.number,
      unitLabel: units.label,
      reportedByName: user.name,
    })
    .from(incidents)
    .leftJoin(units, eq(incidents.unitId, units.id))
    .leftJoin(user, eq(incidents.reportedById, user.id))
    .where(and(
      eq(incidents.id, id),
      eq(incidents.tenantId, session.tenantId),
    ))

  if (!row) {
    throw createError({ statusCode: 404, message: 'Incidencia no encontrada' })
  }

  const userRole = session.user.role ?? ''
  const isAdmin = userRole === 'admin'

  // Hide reporter identity for anonymous incidents (admin and own author can see)
  const hideReporter = row.isAnonymous && !isAdmin && row.reportedById !== session.user.id

  // Get photos
  const photoRows = await db
    .select()
    .from(incidentPhotos)
    .where(eq(incidentPhotos.incidentId, id))

  const photos: IncidentPhoto[] = photoRows.map((p) => ({
    id: p.id,
    incidentId: p.incidentId,
    filePath: p.filePath,
    createdAt: p.createdAt.toISOString(),
  }))

  // Get updates with user name join
  const updateRows = await db
    .select({
      id: incidentUpdates.id,
      incidentId: incidentUpdates.incidentId,
      oldStatus: incidentUpdates.oldStatus,
      newStatus: incidentUpdates.newStatus,
      note: incidentUpdates.note,
      updatedById: incidentUpdates.updatedById,
      createdAt: incidentUpdates.createdAt,
      updatedByName: user.name,
    })
    .from(incidentUpdates)
    .leftJoin(user, eq(incidentUpdates.updatedById, user.id))
    .where(eq(incidentUpdates.incidentId, id))
    .orderBy(asc(incidentUpdates.createdAt))

  const updates: IncidentUpdate[] = updateRows.map((u) => ({
    id: u.id,
    incidentId: u.incidentId,
    oldStatus: u.oldStatus,
    newStatus: u.newStatus,
    note: u.note,
    updatedById: u.updatedById,
    updatedByName: u.updatedByName ?? undefined,
    createdAt: u.createdAt.toISOString(),
  }))

  const incident: Incident = {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    isAnonymous: row.isAnonymous,
    reportedById: hideReporter ? '' : row.reportedById,
    unitId: hideReporter ? '' : row.unitId,
    unitNumber: hideReporter ? undefined : (row.unitNumber ?? undefined),
    unitLabel: hideReporter ? undefined : (row.unitLabel ?? undefined),
    reportedByName: hideReporter ? undefined : (row.reportedByName ?? undefined),
    tenantId: row.tenantId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    photos,
    updates,
  }

  return { data: incident }
})
