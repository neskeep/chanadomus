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
import { staff } from '~~/server/db/schema/staff'
import { householdMemberPasses } from '~~/server/db/schema/household-member-pass'
import { householdMembers } from '~~/server/db/schema/household'
import { eq, and } from 'drizzle-orm'
import type { ValidationResult } from '~~/shared/types/qr'
import type { AccessEvent, AccessResult } from '~~/shared/types/access'
import { broadcastAccessEvent } from '~~/server/utils/ws-access'
import { checkOpenEntry } from '~~/server/utils/access-entry-exit'

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

  const token = body.token.trim()

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
    .where(eq(qrCodes.token, token))
    .limit(1)

  // Token no encontrado in QR codes — check other pass types
  if (!record) {
    const residentPassResult = await validateResidentPass(token, tenantId, session.user.id)
    if (residentPassResult) {
      return { data: residentPassResult }
    }

    const memberPassResult = await validateMemberPass(token, tenantId, session.user.id)
    if (memberPassResult) {
      return { data: memberPassResult }
    }

    const vehiclePassResult = await validateVehiclePass(token, tenantId, session.user.id, body.occupantCount)
    if (vehiclePassResult) {
      return { data: vehiclePassResult }
    }

    const staffPassResult = await validateStaffPass(token, tenantId, session.user.id)
    if (staffPassResult) {
      return { data: staffPassResult }
    }

    const condoStaffResult = await validateCondoStaffPass(token, tenantId, session.user.id)
    if (condoStaffResult) {
      return { data: condoStaffResult }
    }

    await logAccess({ tenantId, entryType: 'qr', result: 'denied', authorizedBy: session.user.id, passToken: token })
    const result: ValidationResult = { status: 'invalid' }
    return { data: result }
  }

  const now = new Date()

  // QR single-use: check if already used — but now allow exit scan
  if (record.usedAt) {
    // Check for open entry — second scan = exit
    const openEntry = await checkOpenEntry(token, tenantId)

    if (openEntry.action === 'exit') {
      const result: ValidationResult = {
        status: 'valid',
        direction: 'exit',
        accessLogId: openEntry.logId,
        visitorName: record.visitorName,
        visitorDocument: record.visitorDocument,
        visitorType: record.visitorType,
        unitNumber: record.unitNumber,
        unitLabel: record.unitLabel,
      }
      return { data: result }
    }

    // No open entry or expired — report as already_used (no valid entry to close)
    await logAccess({
      tenantId, entryType: 'qr', result: 'already_used', qrCodeId: record.id,
      authorizedBy: session.user.id, visitorName: record.visitorName,
      visitorDocument: record.visitorDocument, unitId: record.unitId,
      unitNumber: record.unitNumber, unitLabel: record.unitLabel,
      passToken: token,
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
      passToken: token,
    })
    const result: ValidationResult = {
      status: 'expired',
      visitorName: record.visitorName,
      unitNumber: record.unitNumber,
    }
    return { data: result }
  }

  // Valido — marcar QR como usado y registrar acceso (ENTRY)
  await db.update(qrCodes).set({ usedAt: now }).where(eq(qrCodes.id, record.id))

  await logAccess({
    tenantId, entryType: 'qr', result: 'allowed', qrCodeId: record.id,
    authorizedBy: session.user.id, visitorName: record.visitorName,
    visitorDocument: record.visitorDocument, unitId: record.unitId,
    unitNumber: record.unitNumber, unitLabel: record.unitLabel,
    passToken: token,
  })

  const result: ValidationResult = {
    status: 'valid',
    direction: 'entry',
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
  passToken?: string
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
      passToken: params.passToken ?? null,
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
    direction: 'entry',
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
      passToken: token,
    })
    return {
      status: 'expired',
      residentName: pass.userName,
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      isResidentPass: true,
    }
  }

  // Check for open entry — second scan = exit
  const openEntry = await checkOpenEntry(token, tenantId)

  if (openEntry.action === 'exit') {
    return {
      status: 'valid',
      direction: 'exit',
      accessLogId: openEntry.logId,
      residentName: pass.userName,
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      isResidentPass: true,
    }
  }

  // Entry — log access (multi-use, never mark as used)
  await logAccess({
    tenantId,
    entryType: 'qr',
    result: 'allowed',
    authorizedBy,
    visitorName: pass.userName,
    unitId: pass.unitId,
    unitNumber: pass.unitNumber,
    unitLabel: pass.unitLabel,
    passToken: token,
  })

  return {
    status: 'valid',
    direction: 'entry',
    residentName: pass.userName,
    unitNumber: pass.unitNumber,
    unitLabel: pass.unitLabel,
    expiresAt: pass.expiresAt.toISOString(),
    isResidentPass: true,
  }
}

/** Check if token matches an active household member pass */
async function validateMemberPass(
  token: string,
  tenantId: string,
  authorizedBy: string,
): Promise<ValidationResult | null> {
  const [pass] = await db
    .select({
      id: householdMemberPasses.id,
      memberId: householdMemberPasses.memberId,
      unitId: householdMemberPasses.unitId,
      isActive: householdMemberPasses.isActive,
      expiresAt: householdMemberPasses.expiresAt,
      memberName: householdMembers.name,
      memberRelationship: householdMembers.relationship,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(householdMemberPasses)
    .innerJoin(householdMembers, eq(householdMembers.id, householdMemberPasses.memberId))
    .innerJoin(units, eq(units.id, householdMemberPasses.unitId))
    .where(
      and(
        eq(householdMemberPasses.token, token),
        eq(householdMemberPasses.tenantId, tenantId),
      ),
    )
    .limit(1)

  if (!pass) return null

  // Inactive pass
  if (!pass.isActive) return null

  const now = new Date()

  // Expired member pass
  if (pass.expiresAt && pass.expiresAt <= now) {
    await logAccess({
      tenantId,
      entryType: 'qr',
      result: 'expired',
      authorizedBy,
      visitorName: pass.memberName,
      unitId: pass.unitId,
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      passToken: token,
    })
    return {
      status: 'expired',
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      isMemberPass: true,
      memberName: pass.memberName,
      memberRelationship: pass.memberRelationship,
    }
  }

  // Check for open entry — second scan = exit
  const openEntry = await checkOpenEntry(token, tenantId)

  if (openEntry.action === 'exit') {
    return {
      status: 'valid',
      direction: 'exit',
      accessLogId: openEntry.logId,
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      isMemberPass: true,
      memberName: pass.memberName,
      memberRelationship: pass.memberRelationship,
    }
  }

  // Entry — log access (multi-use, never mark as used)
  await logAccess({
    tenantId,
    entryType: 'qr',
    result: 'allowed',
    authorizedBy,
    visitorName: pass.memberName,
    unitId: pass.unitId,
    unitNumber: pass.unitNumber,
    unitLabel: pass.unitLabel,
    passToken: token,
  })

  return {
    status: 'valid',
    direction: 'entry',
    unitNumber: pass.unitNumber,
    unitLabel: pass.unitLabel,
    expiresAt: pass.expiresAt?.toISOString(),
    isMemberPass: true,
    memberName: pass.memberName,
    memberRelationship: pass.memberRelationship,
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
      passToken: token,
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

  // Check for open entry — second scan = exit
  const openEntry = await checkOpenEntry(token, tenantId)

  if (openEntry.action === 'exit') {
    return {
      status: 'valid',
      direction: 'exit',
      accessLogId: openEntry.logId,
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

  // Entry — log access (multi-use, never mark as used)
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
    passToken: token,
  })

  return {
    status: 'valid',
    direction: 'entry',
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
      passToken: token,
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

  // Check for open entry — second scan = exit
  const openEntry = await checkOpenEntry(token, tenantId)

  if (openEntry.action === 'exit') {
    return {
      status: 'valid',
      direction: 'exit',
      accessLogId: openEntry.logId,
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      isStaffPass: true,
      staffName: pass.staffName,
      staffRole: pass.roleName ?? undefined,
    }
  }

  // Entry — log access (multi-use, never mark as used)
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
    passToken: token,
  })

  return {
    status: 'valid',
    direction: 'entry',
    unitNumber: pass.unitNumber,
    unitLabel: pass.unitLabel,
    expiresAt: pass.expiresAt?.toISOString(),
    isStaffPass: true,
    staffName: pass.staffName,
    staffRole: pass.roleName ?? undefined,
  }
}

/** Check if token matches an active condo staff member (personal del condominio) */
async function validateCondoStaffPass(
  token: string,
  tenantId: string,
  authorizedBy: string,
): Promise<ValidationResult | null> {
  const [member] = await db
    .select({
      id: staff.id,
      name: staff.name,
      role: staff.role,
    })
    .from(staff)
    .where(
      and(
        eq(staff.qrToken, token),
        eq(staff.tenantId, tenantId),
        eq(staff.isActive, true),
      ),
    )
    .limit(1)

  if (!member) return null

  // Check for open entry — second scan = exit
  const openEntry = await checkOpenEntry(token, tenantId)

  if (openEntry.action === 'exit') {
    return {
      status: 'valid',
      direction: 'exit',
      accessLogId: openEntry.logId,
      isCondoStaff: true,
      staffName: member.name,
      staffRole: member.role,
    }
  }

  // Entry — log access (multi-use, never expires)
  await logAccess({
    tenantId,
    entryType: 'qr',
    result: 'allowed',
    authorizedBy,
    visitorName: `${member.name} (${member.role})`,
    passToken: token,
  })

  return {
    status: 'valid',
    direction: 'entry',
    isCondoStaff: true,
    staffName: member.name,
    staffRole: member.role,
  }
}
