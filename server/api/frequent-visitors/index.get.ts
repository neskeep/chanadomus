import { db } from '~~/server/db'
import { frequentVisitors } from '~~/server/db/schema/frequent-visitor'
import { eq, and, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { tenantId, user } = await requireTenant(event)
  const session = await requireRole(event, ['propietario', 'admin', 'conserje'])
  const role = session.user.role

  // Conserje ve todos los visitantes frecuentes de su unidad; propietario solo los suyos
  let ownerFilter
  if (role === 'conserje') {
    const staffUnitId = await getStaffUnitId(user.id, tenantId)
    ownerFilter = eq(frequentVisitors.unitId, staffUnitId)
  } else {
    ownerFilter = eq(frequentVisitors.ownerId, user.id)
  }

  const rows = await db
    .select()
    .from(frequentVisitors)
    .where(
      and(
        ownerFilter,
        eq(frequentVisitors.tenantId, tenantId),
      ),
    )
    .orderBy(desc(frequentVisitors.lastVisitAt), desc(frequentVisitors.visitCount))

  return {
    data: rows.map((row) => ({
      ...row,
      lastVisitAt: row.lastVisitAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  }
})
