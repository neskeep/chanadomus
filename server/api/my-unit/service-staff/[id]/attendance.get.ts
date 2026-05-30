import { db } from '~~/server/db'
import { accessLogs } from '~~/server/db/schema/access'
import { serviceStaffPasses } from '~~/server/db/schema/service-staff-pass'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { eq, and, desc, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { tenantId } = session
  const unitId = (session.user as Record<string, unknown>).unitId as string | undefined

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Sin unidad asignada' })
  }

  const staffId = getRouterParam(event, 'id')
  if (!staffId) {
    throw createError({ statusCode: 400, message: 'ID de personal requerido' })
  }

  // Verify staff belongs to user's unit
  const [staff] = await db
    .select({ id: unitServiceStaff.id })
    .from(unitServiceStaff)
    .where(
      and(
        eq(unitServiceStaff.id, staffId),
        eq(unitServiceStaff.unitId, unitId),
        eq(unitServiceStaff.tenantId, tenantId),
      ),
    )
    .limit(1)

  if (!staff) {
    throw createError({ statusCode: 404, message: 'Personal no encontrado' })
  }

  // Get all pass IDs for this staff (active + inactive for historical data)
  const passes = await db
    .select({ id: serviceStaffPasses.id })
    .from(serviceStaffPasses)
    .where(
      and(
        eq(serviceStaffPasses.staffId, staffId),
        eq(serviceStaffPasses.tenantId, tenantId),
      ),
    )

  if (passes.length === 0) {
    return { data: [] }
  }

  const passIds = passes.map(p => p.id)

  // Get access logs linked to these passes
  const logs = await db
    .select({
      id: accessLogs.id,
      result: accessLogs.result,
      entryType: accessLogs.entryType,
      exitAt: accessLogs.exitAt,
      createdAt: accessLogs.createdAt,
      notes: accessLogs.notes,
    })
    .from(accessLogs)
    .where(
      and(
        inArray(accessLogs.staffPassId, passIds),
        eq(accessLogs.tenantId, tenantId),
      ),
    )
    .orderBy(desc(accessLogs.createdAt))
    .limit(50)

  const data = logs.map(log => ({
    id: log.id,
    result: log.result,
    entryType: log.entryType,
    exitAt: log.exitAt?.toISOString() ?? null,
    createdAt: log.createdAt.toISOString(),
    notes: log.notes,
  }))

  return { data }
})
