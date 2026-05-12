import { db } from '~~/server/db'
import { qrCodes, accessLogs } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import { residentPasses } from '~~/server/db/schema/resident-pass'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { vehicles } from '~~/server/db/schema/vehicle'
import { user } from '~~/server/db/schema/auth'
import { serviceStaffPasses } from '~~/server/db/schema/service-staff-pass'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { eq, and } from 'drizzle-orm'
import type { ValidationResult } from '~~/shared/types/qr'
import type { AccessEvent, AccessResult } from '~~/shared/types/access'
import { broadcastAccessEvent } from '~~/server/utils/ws-access'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const tenantId = (session.user as Record<string, unknown>).tenantId as string | undefined

  if (!tenantId) {
    throw createError({ statusCode: 403, message: 'Usuario sin tenant asignado' })
  }

  const body = await readBody<{ token: string; occupantCount?: number }>(event)

  if (!body.token?.trim()) {
    throw createError({ statusCode: 400, message: 'token es requerido' })
  }

  // Buscar QR por token con join a units
  const [record] = await db
    .select({
      id: qrCodes.id,
      visitorName: qrCodes.visitorName,
      visitorDocument: qrCodes.visitorDocument,
      visitorType: qrCodes.visitorType,
      unitId: qrCodes.unitId,
      expiresAt: qrCodes.expiresAt,
      usedAt: qrCodes.usedAt,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(qrCodes)
    .innerJoin(units, eq(units.id, qrCodes.unitId))
    .where(eq(qrCodes.token, body.token.trim()))
    .limit(1)

  // Token no encontrado in QR codes — check resident passes
  if (!record) {
    const residentPassResult = await validateResidentPass(body.token.trim(), tenantId, session.user.id)
    if (residentPassResult) {
      return { data: residentPassResult }
    }

    // Check vehicle passes
    const vehiclePassResult = await validateVehiclePass(body.token.trim(), tenantId, session.user.id, body.occupantCount)
    if (vehiclePassResult) {
      return { data: vehiclePassResult }
    }

    // Check service staff passes
    const staffPassResult = await validateStaffPass(body.token.trim(), tenantId, session.user.id)
    if (staffPassResult) {
      return { data: staffPassResult }
    }

    await logAccess({ tenantId, entryType: 'qr', result: 'denied', authorizedBy: session.user.id })
    const result: ValidationResult = { status: 'invalid' }
    return { data: result }
  }

  const now = new Date()

  // Ya usado
  if (record.usedAt) {
    await logAccess({
      tenantId, entryType: 'qr', result: 'already_used', qrCodeId: record.id,
      authorizedBy: session.user.id, visitorName: record.visitorName,
      visitorDocument: record.visitorDocument, unitId: record.unitId,
      unitNumber: record.unitNumber, unitLabel: record.unitLabel,
    })
    const result: ValidationResult = {
      status: 'already_used',
      visitorName: record.visitorName,
      unitNumber: record.unitNumber,
      usedAt: record.usedAt.toISOString(),
    }
    return { data: result }
  }

  // Expirado
  if (record.expiresAt <= now) {
    await logAccess({
      tenantId, entryType: 'qr', result: 'expired', qrCodeId: record.id,
      authorizedBy: session.user.id, visitorName: record.visitorName,
      visitorDocument: record.visitorDocument, unitId: record.unitId,
      unitNumber: record.unitNumber, unitLabel: record.unitLabel,
    })
    const result: ValidationResult = {
      status: 'expired',
      visitorName: record.visitorName,
      unitNumber: record.unitNumber,
    }
    return { data: result }
  }

  // Valido — marcar QR como usado y registrar acceso
  await db.update(qrCodes).set({ usedAt: now }).where(eq(qrCodes.id, record.id))

  await logAccess({
    tenantId, entryType: 'qr', result: 'allowed', qrCodeId: record.id,
    authorizedBy: session.user.id, visitorName: record.visitorName,
    visitorDocument: record.visitorDocument, unitId: record.unitId,
    unitNumber: record.unitNumber, unitLabel: record.unitLabel,
  })

  const result: ValidationResult = {
    status: 'valid',
    visitorName: record.visitorName,
    visitorDocument: record.visitorDocument,
    visitorType: record.visitorType,
    unitNumber: record.unitNumber,
    unitLabel: record.unitLabel,
    expiresAt: record.expiresAt.toISOString(),
  }
  return { data: result }
})

/** Helper to insert access log + broadcast event */
async function logAccess(params: {
  tenantId: string
  entryType: 'qr' | 'manual' | 'webhook'
  result: AccessResult
  qrCodeId?: string
  authorizedBy?: string
  visitorName?: string | null
  visitorDocument?: string | null
  unitId?: string
  unitNumber?: string | null
  unitLabel?: string | null
  vehiclePassId?: string
  staffPassId?: string
  occupantCount?: number
  vehiclePlate?: string | null
}) {
  const rows = await db
    .insert(accessLogs)
    .values({
      entryType: params.entryType,
      result: params.result,
      qrCodeId: params.qrCodeId ?? null,
      authorizedBy: params.authorizedBy ?? null,
      visitorName: params.visitorName ?? null,
      visitorDocument: params.visitorDocument ?? null,
      unitId: params.unitId ?? null,
      tenantId: params.tenantId,
      vehiclePassId: params.vehiclePassId ?? null,
      staffPassId: params.staffPassId ?? null,
      occupantCount: params.occupantCount ?? null,
    })
    .returning({ id: accessLogs.id, createdAt: accessLogs.createdAt })

  const log = rows[0]
  if (!log) return

  const accessEvent: AccessEvent = {
    id: log.id,
    entryType: params.entryType,
    result: params.result,
    visitorName: params.visitorName ?? null,
    visitorDocument: params.visitorDocument ?? null,
    unitNumber: params.unitNumber ?? null,
    unitLabel: params.unitLabel ?? null,
    notes: null,
    exitAt: null,
    createdAt: log.createdAt.toISOString(),
    vehiclePassId: params.vehiclePassId ?? null,
    staffPassId: params.staffPassId ?? null,
    occupantCount: params.occupantCount ?? null,
    vehiclePlate: params.vehiclePlate ?? null,
  }

  broadcastAccessEvent(accessEvent)
}

/** Check if token matches an active, non-expired resident pass */
async function validateResidentPass(
  token: string,
  tenantId: string,
  authorizedBy: string,
): Promise<ValidationResult | null> {
  const [pass] = await db
    .select({
      id: residentPasses.id,
      userId: residentPasses.userId,
      unitId: residentPasses.unitId,
      expiresAt: residentPasses.expiresAt,
      userName: user.name,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(residentPasses)
    .innerJoin(user, eq(user.id, residentPasses.userId))
    .innerJoin(units, eq(units.id, residentPasses.unitId))
    .where(
      and(
        eq(residentPasses.token, token),
        eq(residentPasses.tenantId, tenantId),
        eq(residentPasses.isActive, true),
      ),
    )
    .limit(1)

  if (!pass) return null

  const now = new Date()

  // Expired resident pass
  if (pass.expiresAt <= now) {
    await logAccess({
      tenantId,
      entryType: 'qr',
      result: 'expired',
      authorizedBy,
      visitorName: pass.userName,
      unitId: pass.unitId,
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
    })
    return {
      status: 'expired',
      residentName: pass.userName,
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      isResidentPass: true,
    }
  }

  // Valid resident pass — log access but do NOT mark as used (multi-use)
  await logAccess({
    tenantId,
    entryType: 'qr',
    result: 'allowed',
    authorizedBy,
    visitorName: pass.userName,
    unitId: pass.unitId,
    unitNumber: pass.unitNumber,
    unitLabel: pass.unitLabel,
  })

  return {
    status: 'valid',
    residentName: pass.userName,
    unitNumber: pass.unitNumber,
    unitLabel: pass.unitLabel,
    expiresAt: pass.expiresAt.toISOString(),
    isResidentPass: true,
  }
}

/** Check if token matches an active vehicle pass */
async function validateVehiclePass(
  token: string,
  tenantId: string,
  authorizedBy: string,
  occupantCount?: number,
): Promise<ValidationResult | null> {
  const [pass] = await db
    .select({
      id: vehiclePasses.id,
      vehicleId: vehiclePasses.vehicleId,
      passType: vehiclePasses.passType,
      isActive: vehiclePasses.isActive,
      occupantLimit: vehiclePasses.occupantLimit,
      expiresAt: vehiclePasses.expiresAt,
      plate: vehicles.plate,
      brand: vehicles.brand,
      model: vehicles.model,
      color: vehicles.color,
      unitId: vehicles.unitId,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(vehiclePasses)
    .innerJoin(vehicles, eq(vehicles.id, vehiclePasses.vehicleId))
    .innerJoin(units, eq(units.id, vehicles.unitId))
    .where(
      and(
        eq(vehiclePasses.token, token),
        eq(vehiclePasses.tenantId, tenantId),
      ),
    )
    .limit(1)

  if (!pass) return null

  // Inactive pass
  if (!pass.isActive) return null

  const now = new Date()

  // Expired vehicle pass
  if (pass.expiresAt && pass.expiresAt <= now) {
    await logAccess({
      tenantId,
      entryType: 'qr',
      result: 'expired',
      authorizedBy,
      vehiclePassId: pass.id,
      visitorName: `Vehiculo ${pass.plate}`,
      unitId: pass.unitId,
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      vehiclePlate: pass.plate,
    })
    return {
      status: 'expired',
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      isVehiclePass: true,
      vehiclePlate: pass.plate,
      vehicleBrand: pass.brand,
      vehicleModel: pass.model,
      vehicleColor: pass.color,
      passType: pass.passType,
      occupantLimit: pass.occupantLimit,
    }
  }

  // Valid vehicle pass — log access (multi-use, never mark as used)
  await logAccess({
    tenantId,
    entryType: 'qr',
    result: 'allowed',
    authorizedBy,
    vehiclePassId: pass.id,
    occupantCount,
    visitorName: `Vehiculo ${pass.plate}`,
    unitId: pass.unitId,
    unitNumber: pass.unitNumber,
    unitLabel: pass.unitLabel,
    vehiclePlate: pass.plate,
  })

  return {
    status: 'valid',
    unitNumber: pass.unitNumber,
    unitLabel: pass.unitLabel,
    expiresAt: pass.expiresAt?.toISOString(),
    isVehiclePass: true,
    vehiclePlate: pass.plate,
    vehicleBrand: pass.brand,
    vehicleModel: pass.model,
    vehicleColor: pass.color,
    passType: pass.passType,
    occupantLimit: pass.occupantLimit,
  }
}

/** Check if token matches an active service staff pass */
async function validateStaffPass(
  token: string,
  tenantId: string,
  authorizedBy: string,
): Promise<ValidationResult | null> {
  const [pass] = await db
    .select({
      id: serviceStaffPasses.id,
      staffId: serviceStaffPasses.staffId,
      unitId: serviceStaffPasses.unitId,
      isActive: serviceStaffPasses.isActive,
      expiresAt: serviceStaffPasses.expiresAt,
      staffName: unitServiceStaff.name,
      roleName: serviceStaffRoles.name,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(serviceStaffPasses)
    .innerJoin(unitServiceStaff, eq(unitServiceStaff.id, serviceStaffPasses.staffId))
    .leftJoin(serviceStaffRoles, eq(serviceStaffRoles.id, unitServiceStaff.roleId))
    .innerJoin(units, eq(units.id, serviceStaffPasses.unitId))
    .where(
      and(
        eq(serviceStaffPasses.token, token),
        eq(serviceStaffPasses.tenantId, tenantId),
      ),
    )
    .limit(1)

  if (!pass) return null

  // Inactive pass
  if (!pass.isActive) return null

  const now = new Date()

  // Expired staff pass
  if (pass.expiresAt && pass.expiresAt <= now) {
    await logAccess({
      tenantId,
      entryType: 'qr',
      result: 'expired',
      authorizedBy,
      staffPassId: pass.id,
      visitorName: `${pass.staffName} (${pass.roleName ?? 'Personal'})`,
      unitId: pass.unitId,
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
    })
    return {
      status: 'expired',
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      isStaffPass: true,
      staffName: pass.staffName,
      staffRole: pass.roleName ?? undefined,
    }
  }

  // Valid staff pass — log access (multi-use, never mark as used)
  await logAccess({
    tenantId,
    entryType: 'qr',
    result: 'allowed',
    authorizedBy,
    staffPassId: pass.id,
    visitorName: `${pass.staffName} (${pass.roleName ?? 'Personal'})`,
    unitId: pass.unitId,
    unitNumber: pass.unitNumber,
    unitLabel: pass.unitLabel,
  })

  return {
    status: 'valid',
    unitNumber: pass.unitNumber,
    unitLabel: pass.unitLabel,
    expiresAt: pass.expiresAt?.toISOString(),
    isStaffPass: true,
    staffName: pass.staffName,
    staffRole: pass.roleName ?? undefined,
  }
}
