import { db } from '~~/server/db'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { vehicles } from '~~/server/db/schema/vehicle'
import { units } from '~~/server/db/schema/unit'
import { eq, and, desc, sql } from 'drizzle-orm'
import type { VehiclePass, VehiclePassType } from '~~/shared/types/vehicle-pass'

const VALID_TYPES: VehiclePassType[] = ['resident', 'guest', 'temporary']

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin', 'vigilancia', 'conserje'])
  const { tenantId } = await requireTenant(event)

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
      unitId: vehiclePasses.unitId,
      token: vehiclePasses.token,
      passType: vehiclePasses.passType,
      isActive: vehiclePasses.isActive,
      issuedBy: vehiclePasses.issuedBy,
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
    .where(and(...conditions))
    .orderBy(desc(vehiclePasses.createdAt))

  // Collect unique unit IDs to resolve in a single query
  const unitIds = new Set<string>()
  for (const row of rows) {
    const uid = row.vehicleUnitId ?? row.unitId
    if (uid) unitIds.add(uid)
  }

  // Fetch units in one query
  const unitMap = new Map<string, { number: string; label: string | null }>()
  if (unitIds.size > 0) {
    const unitRows = await db
      .select({ id: units.id, number: units.number, label: units.label })
      .from(units)
      .where(sql`${units.id} IN (${sql.join([...unitIds].map(id => sql`${id}`), sql`, `)})`)

    for (const u of unitRows) {
      unitMap.set(u.id, { number: u.number, label: u.label })
    }
  }

  const data: VehiclePass[] = rows.map((row) => {
    const resolvedUnitId = row.vehicleUnitId ?? row.unitId
    const unit = resolvedUnitId ? unitMap.get(resolvedUnitId) : null

    return {
      id: row.id,
      vehicleId: row.vehicleId,
      unitId: row.unitId,
      token: row.token,
      passType: row.passType,
      isActive: row.isActive,
      issuedBy: row.issuedBy,
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
      unitNumber: unit?.number ?? null,
      unitLabel: unit?.label ?? null,
    }
  })

  return { data }
})
