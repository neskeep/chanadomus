import { db } from '~~/server/db'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { vehicles } from '~~/server/db/schema/vehicle'
import { units } from '~~/server/db/schema/unit'
import { user } from '~~/server/db/schema/auth'
import { eq, and } from 'drizzle-orm'
import type { VehiclePass } from '~~/shared/types/vehicle-pass'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin', 'vigilancia', 'conserje'])
  const { tenantId } = await requireTenant(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'id es requerido' })
  }

  const [row] = await db
    .select({
      id: vehiclePasses.id,
      vehicleId: vehiclePasses.vehicleId,
      unitId: vehiclePasses.unitId,
      token: vehiclePasses.token,
      passType: vehiclePasses.passType,
      isActive: vehiclePasses.isActive,
      issuedBy: vehiclePasses.issuedBy,
      issuedByName: user.name,
      description: vehiclePasses.description,
      occupantLimit: vehiclePasses.occupantLimit,
      expiresAt: vehiclePasses.expiresAt,
      notes: vehiclePasses.notes,
      createdAt: vehiclePasses.createdAt,
      deactivatedAt: vehiclePasses.deactivatedAt,
      vehiclePlate: vehicles.plate,
      vehicleBrand: vehicles.brand,
      vehicleModel: vehicles.model,
      vehicleColor: vehicles.color,
      vehicleUnitId: vehicles.unitId,
    })
    .from(vehiclePasses)
    .leftJoin(vehicles, eq(vehicles.id, vehiclePasses.vehicleId))
    .leftJoin(user, eq(user.id, vehiclePasses.issuedBy))
    .where(and(eq(vehiclePasses.id, id), eq(vehiclePasses.tenantId, tenantId)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, message: 'Pase vehicular no encontrado' })
  }

  // Resolve unit
  const resolvedUnitId = row.vehicleUnitId ?? row.unitId
  let unitNumber: string | null = null
  let unitLabel: string | null = null

  if (resolvedUnitId) {
    const [unit] = await db
      .select({ number: units.number, label: units.label })
      .from(units)
      .where(eq(units.id, resolvedUnitId))
      .limit(1)
    if (unit) {
      unitNumber = unit.number
      unitLabel = unit.label
    }
  }

  const data: VehiclePass & { issuedByName: string | null } = {
    id: row.id,
    vehicleId: row.vehicleId,
    unitId: row.unitId,
    token: row.token,
    passType: row.passType,
    isActive: row.isActive,
    issuedBy: row.issuedBy,
    issuedByName: row.issuedByName,
    description: row.description,
    occupantLimit: row.occupantLimit,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    deactivatedAt: row.deactivatedAt?.toISOString() ?? null,
    vehiclePlate: row.vehiclePlate,
    vehicleBrand: row.vehicleBrand,
    vehicleModel: row.vehicleModel,
    vehicleColor: row.vehicleColor,
    unitNumber,
    unitLabel,
  }

  return { data }
})
