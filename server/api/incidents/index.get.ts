import { db } from '~~/server/db'
import { incidents } from '~~/server/db/schema/incident'
import { units } from '~~/server/db/schema/unit'
import { user } from '~~/server/db/schema/auth'
import { eq, and, sql, desc, count } from 'drizzle-orm'
import type { Incident, IncidentStatus, IncidentPriority } from '~~/shared/types/incident'

const VALID_STATUSES: IncidentStatus[] = ['open', 'in_progress', 'resolved', 'closed']
const VALID_PRIORITIES: IncidentPriority[] = ['low', 'medium', 'high']

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const query = getQuery(event)
  const status = query.status as string | undefined
  const priority = query.priority as string | undefined
  const unitId = query.unit_id as string | undefined
  const mine = query.mine === 'true'
  const page = Math.max(1, parseInt(query.page as string, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20))
  const offset = (page - 1) * limit

  // Validate filter values
  if (status && !VALID_STATUSES.includes(status as IncidentStatus)) {
    throw createError({ statusCode: 400, message: 'Estado invalido' })
  }
  if (priority && !VALID_PRIORITIES.includes(priority as IncidentPriority)) {
    throw createError({ statusCode: 400, message: 'Prioridad invalida' })
  }

  // Build conditions
  const conditions = [eq(incidents.tenantId, session.tenantId)]

  const userRole = session.user.role ?? ''
  const isAdmin = userRole === 'admin'

  if (mine) {
    conditions.push(eq(incidents.reportedById, session.user.id))
  }

  if (status) {
    conditions.push(eq(incidents.status, status as IncidentStatus))
  }
  if (priority) {
    conditions.push(eq(incidents.priority, priority as IncidentPriority))
  }
  if (unitId) {
    conditions.push(eq(incidents.unitId, unitId))
  }

  const whereClause = and(...conditions)

  // Get total count
  const [totalRow] = await db
    .select({ total: count() })
    .from(incidents)
    .where(whereClause)

  const total = totalRow?.total ?? 0

  // Get paginated results with joins
  const rows = await db
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
    .where(whereClause)
    .orderBy(desc(incidents.createdAt))
    .limit(limit)
    .offset(offset)

  const data: Incident[] = rows.map((row) => {
    // Hide reporter identity for anonymous incidents (admin and own author can see)
    const hideReporter = row.isAnonymous && !isAdmin && row.reportedById !== session.user.id

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      reportedById: hideReporter ? '' : row.reportedById,
      unitId: hideReporter ? '' : row.unitId,
      unitNumber: hideReporter ? undefined : (row.unitNumber ?? undefined),
      unitLabel: hideReporter ? undefined : (row.unitLabel ?? undefined),
      reportedByName: hideReporter ? undefined : (row.reportedByName ?? undefined),
      isAnonymous: row.isAnonymous,
      tenantId: row.tenantId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
    }
  })

  return { data, meta: { total, page, limit } }
})
