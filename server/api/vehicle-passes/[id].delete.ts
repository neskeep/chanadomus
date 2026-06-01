import { db } from '~~/server/db'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { accessLogs } from '~~/server/db/schema/access'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'id es requerido' })
  }

  const [existing] = await db
    .select({ id: vehiclePasses.id })
    .from(vehiclePasses)
    .where(and(eq(vehiclePasses.id, id), eq(vehiclePasses.tenantId, tenantId)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Pase vehicular no encontrado' })
  }

  await db.transaction(async (tx) => {
    // Nullify FK in access_logs to preserve history
    await tx
      .update(accessLogs)
      .set({ vehiclePassId: null })
      .where(eq(accessLogs.vehiclePassId, id))

    await tx
      .delete(vehiclePasses)
      .where(and(eq(vehiclePasses.id, id), eq(vehiclePasses.tenantId, tenantId)))
  })

  return { data: { success: true } }
})
