import { db } from '~~/server/db'
import { vehicles } from '~~/server/db/schema/vehicle'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
  const unitId = (session.user as Record<string, unknown>).unitId as string

  if (!unitId) {
    throw createError({ statusCode: 403, message: 'Usuario sin unidad asignada' })
  }

  const rows = await db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.unitId, unitId),
        eq(vehicles.tenantId, tenantId),
      ),
    )
    .orderBy(asc(vehicles.plate))

  return { data: rows }
})
