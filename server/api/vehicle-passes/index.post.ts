import { db } from '~~/server/db'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { vehicles } from '~~/server/db/schema/vehicle'
import { eq, and } from 'drizzle-orm'
import type { CreateVehiclePassInput } from '~~/shared/types/vehicle-pass'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const body = await readBody<CreateVehiclePassInput>(event)

  if (!body.vehicleId?.trim()) {
    throw createError({ statusCode: 400, message: 'vehicleId es requerido' })
  }
  if (!body.passType || !['resident', 'guest'].includes(body.passType)) {
    throw createError({ statusCode: 400, message: 'passType debe ser "resident" o "guest"' })
  }
  if (body.occupantLimit !== undefined && body.occupantLimit !== null) {
    if (typeof body.occupantLimit !== 'number' || body.occupantLimit < 1) {
      throw createError({ statusCode: 400, message: 'occupantLimit debe ser un numero positivo' })
    }
  }

  // Validate vehicle exists and belongs to tenant
  const [vehicle] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(and(eq(vehicles.id, body.vehicleId), eq(vehicles.tenantId, tenantId)))
    .limit(1)

  if (!vehicle) {
    throw createError({ statusCode: 404, message: 'Vehiculo no encontrado' })
  }

  const token = crypto.randomUUID()

  const rows = await db
    .insert(vehiclePasses)
    .values({
      vehicleId: body.vehicleId,
      token,
      passType: body.passType,
      issuedBy: session.user.id,
      occupantLimit: body.occupantLimit ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      notes: body.notes ?? null,
      tenantId,
    })
    .returning()

  const created = rows[0]
  if (!created) {
    throw createError({ statusCode: 500, message: 'Error al crear pase vehicular' })
  }

  return {
    data: {
      ...created,
      expiresAt: created.expiresAt?.toISOString() ?? null,
      createdAt: created.createdAt.toISOString(),
      deactivatedAt: created.deactivatedAt?.toISOString() ?? null,
    },
  }
})
