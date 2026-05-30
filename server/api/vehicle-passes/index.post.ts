import { db } from '~~/server/db'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { vehicles } from '~~/server/db/schema/vehicle'
import { units } from '~~/server/db/schema/unit'
import { eq, and } from 'drizzle-orm'
import type { CreateVehiclePassInput } from '~~/shared/types/vehicle-pass'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const body = await readBody<CreateVehiclePassInput>(event)

  if (!body.passType || !['resident', 'guest', 'temporary'].includes(body.passType)) {
    throw createError({ statusCode: 400, message: 'passType debe ser "resident", "guest" o "temporary"' })
  }

  if (body.occupantLimit !== undefined && body.occupantLimit !== null) {
    if (typeof body.occupantLimit !== 'number' || body.occupantLimit < 1) {
      throw createError({ statusCode: 400, message: 'occupantLimit debe ser un numero positivo' })
    }
  }

  let vehicleId: string | null = null
  let unitId: string | null = null

  if (body.passType === 'temporary') {
    // Temporary passes: vehicleId optional, description required
    if (!body.description?.trim()) {
      throw createError({ statusCode: 400, message: 'description es requerido para pases temporales' })
    }
    if (!body.expiresAt) {
      throw createError({ statusCode: 400, message: 'Fecha de vencimiento es requerida para pases temporales' })
    }

    // Optional: assign to a unit
    if (body.unitId) {
      const [unit] = await db
        .select({ id: units.id })
        .from(units)
        .where(and(eq(units.id, body.unitId), eq(units.tenantId, tenantId)))
        .limit(1)
      if (!unit) {
        throw createError({ statusCode: 404, message: 'Unidad no encontrada' })
      }
      unitId = body.unitId
    }

    // Optional: assign to a vehicle
    if (body.vehicleId?.trim()) {
      const [vehicle] = await db
        .select({ id: vehicles.id })
        .from(vehicles)
        .where(and(eq(vehicles.id, body.vehicleId), eq(vehicles.tenantId, tenantId)))
        .limit(1)
      if (!vehicle) {
        throw createError({ statusCode: 404, message: 'Vehiculo no encontrado' })
      }
      vehicleId = body.vehicleId
    }
  } else {
    // Resident/guest passes: vehicleId required
    if (!body.vehicleId?.trim()) {
      throw createError({ statusCode: 400, message: 'vehicleId es requerido' })
    }

    const [vehicle] = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.id, body.vehicleId), eq(vehicles.tenantId, tenantId)))
      .limit(1)

    if (!vehicle) {
      throw createError({ statusCode: 404, message: 'Vehiculo no encontrado' })
    }
    vehicleId = body.vehicleId
  }

  const token = crypto.randomUUID()

  const rows = await db
    .insert(vehiclePasses)
    .values({
      vehicleId,
      unitId,
      token,
      passType: body.passType,
      issuedBy: session.user.id,
      description: body.description?.trim() || null,
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
