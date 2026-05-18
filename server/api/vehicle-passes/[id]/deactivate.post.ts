import { db } from '~~/server/db'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'id es requerido' })
  }

  // Validate pass exists and belongs to tenant
  const [existing] = await db
    .select({ id: vehiclePasses.id, isActive: vehiclePasses.isActive })
    .from(vehiclePasses)
    .where(and(eq(vehiclePasses.id, id), eq(vehiclePasses.tenantId, tenantId)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Pase vehicular no encontrado' })
  }

  if (!existing.isActive) {
    throw createError({ statusCode: 400, message: 'El pase ya esta desactivado' })
  }

  await db
    .update(vehiclePasses)
    .set({ isActive: false, deactivatedAt: new Date() })
    .where(eq(vehiclePasses.id, id))

  return { data: { success: true } }
})
