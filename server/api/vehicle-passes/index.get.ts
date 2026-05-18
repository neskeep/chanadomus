import { db } from '~~/server/db'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { vehicles } from '~~/server/db/schema/vehicle'
import { units } from '~~/server/db/schema/unit'
import { eq, and, desc } from 'drizzle-orm'
import type { VehiclePass, VehiclePassType } from '~~/shared/types/vehicle-pass'

const VALID_TYPES: VehiclePassType[] = ['resident', 'guest']

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin', 'vigilancia', 'conserje'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const query = getQuery(event)
  const vehicleId = query.vehicleId as string | undefined
  const passType = query.passType as string | undefined
  const isActive = query.isActive !== 'false' // default true

  if (passType && !VALID_TYPES.includes(passType as VehiclePassType)) {
    throw createError({ statusCode: 400, message: 'Tipo de pase invalido' })
  }

  const conditions = [eq(vehiclePasses.tenantId, tenantId)]

  if (vehicleId) {
    conditions.push(eq(vehiclePasses.vehicleId, vehicleId))
  }
  if (passType) {
    conditions.push(eq(vehiclePasses.passType, passType as VehiclePassType))
  }
  conditions.push(eq(vehiclePasses.isActive, isActive))

  const rows = await db
    .select({
      id: vehiclePasses.id,
      vehicleId: vehiclePasses.vehicleId,
      token: vehiclePasses.token,
      passType: vehiclePasses.passType,
      isActive: vehiclePasses.isActive,
      issuedBy: vehiclePasses.issuedBy,
      occupantLimit: vehiclePasses.occupantLimit,
      expiresAt: vehiclePasses.expiresAt,
      notes: vehiclePasses.notes,
      createdAt: vehiclePasses.createdAt,
      deactivatedAt: vehiclePasses.deactivatedAt,
      vehiclePlate: vehicles.plate,
      vehicleBrand: vehicles.brand,
      vehicleModel: vehicles.model,
      vehicleColor: vehicles.color,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(vehiclePasses)
    .innerJoin(vehicles, eq(vehicles.id, vehiclePasses.vehicleId))
    .innerJoin(units, eq(units.id, vehicles.unitId))
    .where(and(...conditions))
    .orderBy(desc(vehiclePasses.createdAt))

  const data: VehiclePass[] = rows.map((row) => ({
    id: row.id,
    vehicleId: row.vehicleId,
    token: row.token,
    passType: row.passType,
    isActive: row.isActive,
    issuedBy: row.issuedBy,
    occupantLimit: row.occupantLimit,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    deactivatedAt: row.deactivatedAt?.toISOString() ?? null,
    vehiclePlate: row.vehiclePlate,
    vehicleBrand: row.vehicleBrand,
    vehicleModel: row.vehicleModel,
    vehicleColor: row.vehicleColor,
    unitNumber: row.unitNumber,
    unitLabel: row.unitLabel ?? undefined,
  }))

  return { data }
})
