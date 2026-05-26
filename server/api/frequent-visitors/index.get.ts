import { db } from '~~/server/db'
import { frequentVisitors } from '~~/server/db/schema/frequent-visitor'
import { eq, and, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { tenantId, user } = await requireTenant(event)
  const session = await requireRole(event, ['propietario', 'admin', 'conserje'])

  // Filtrar por unitId para que propietario y conserje compartan visitantes frecuentes
  const userUnitId = await getUnitIdForPass(user.id, tenantId, session.user.role as string)
  if (!userUnitId) {
    throw createError({ statusCode: 400, message: 'Usuario sin unidad asignada' })
  }
  const ownerFilter = eq(frequentVisitors.unitId, userUnitId)

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
