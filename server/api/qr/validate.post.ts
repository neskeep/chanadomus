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
import { checkOpenEntry, hasOpenEntry } from '~~/server/utils/access-entry-exit'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { tenantId } = session

  const body = await readBody<{ token: string; direction: 'entry' | 'exit'; occupantCount?: number }>(event)

  if (!body.token?.trim()) {
    throw createError({ statusCode: 400, message: 'token es requerido' })
  }

  if (!body.direction || (body.direction !== 'entry' && body.direction !== 'exit')) {
    throw createError({ statusCode: 400, message: 'direction es requerido y debe ser "entry" o "exit"' })
  }

  const token = body.token.trim()
  const direction = body.direction

  // Prevent duplicate consecutive entries — if there's an open entry, block re-entry
  if (direction === 'entry') {
    const openEntry = await hasOpenEntry(token, tenantId)
    if (openEntry.exists) {
      const result: ValidationResult = {
        status: 'already_inside',
        entryAt: openEntry.entryAt,
      }
      return { data: result }
    }
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
      multiUse: qrCodes.multiUse,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(qrCodes)
    .innerJoin(units, eq(units.id, qrCodes.unitId))
    .where(eq(qrCodes.token, token))
    .limit(1)

  // Token no encontrado in QR codes — check other pass types
  if (!record) {
    const residentPassResult = await validateResidentPass(token, tenantId, session.user.id, direction)
    if (residentPassResult) {
      return { data: residentPassResult }
    }

    const memberPassResult = await validateMemberPass(token, tenantId, session.user.id, direction)
    if (memberPassResult) {
      return { data: memberPassResult }
    }

    const vehiclePassResult = await validateVehiclePass(token, tenantId, session.user.id, direction, body.occupantCount)
    if (vehiclePassResult) {
      return { data: vehiclePassResult }
    }

    const staffPassResult = await validateStaffPass(token, tenantId, session.user.id, direction)
    if (staffPassResult) {
      return { data: staffPassResult }
    }

    const condoStaffResult = await validateCondoStaffPass(token, tenantId, session.user.id, direction)
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
    if (direction === 'exit') {
      // Try to close an open entry
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

      // No open entry — still log exit (guard saw them leave)
      await logAccess({
        tenantId, entryType: 'qr', result: 'allowed', qrCodeId: record.id,
        authorizedBy: session.user.id, visitorName: record.visitorName,
        visitorDocument: record.visitorDocument, unitId: record.unitId,
        unitNumber: record.unitNumber, unitLabel: record.unitLabel,
        passToken: token, direction: 'exit',
      })
      const result: ValidationResult = {
        status: 'valid',
        direction: 'exit',
        visitorName: record.visitorName,
        visitorDocument: record.visitorDocument,
        visitorType: record.visitorType,
        unitNumber: record.unitNumber,
        unitLabel: record.unitLabel,
      }
      return { data: result }
    }

    // direction === 'entry' but QR already used — report as already_used
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

  if (direction === 'entry') {
    // Entry — marcar QR como usado solo si es single-use
    if (!record.multiUse) {
      await db.update(qrCodes).set({ usedAt: now }).where(eq(qrCodes.id, record.id))
    }

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
  }

  // direction === 'exit' — try to close an open entry (multi-use or unused QR)
  if (record.multiUse) {
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
  }

  // Fallback: no open entry to close — log exit-only
  await logAccess({
    tenantId, entryType: 'qr', result: 'allowed', qrCodeId: record.id,
    authorizedBy: session.user.id, visitorName: record.visitorName,
    visitorDocument: record.visitorDocument, unitId: record.unitId,
    unitNumber: record.unitNumber, unitLabel: record.unitLabel,
    passToken: token, direction: 'exit',
  })

  const result: ValidationResult = {
    status: 'valid',
    direction: 'exit',
    visitorName: record.visitorName,
    visitorDocument: record.visitorDocument,
    visitorType: record.visitorType,
    unitNumber: record.unitNumber,
    unitLabel: record.unitLabel,
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
  unitId?: string | null
  unitNumber?: string | null
  unitLabel?: string | null
  vehiclePassId?: string
  staffPassId?: string
  occupantCount?: number
  vehiclePlate?: string | null
  passToken?: string
  direction?: 'entry' | 'exit'
}) {
  const logDirection = params.direction ?? 'entry'
  const exitAt = logDirection === 'exit' ? new Date() : null

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
      exitAt,
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
    exitAt: exitAt?.toISOString() ?? null,
    createdAt: log.createdAt.toISOString(),
    vehiclePassId: params.vehiclePassId ?? null,
    staffPassId: params.staffPassId ?? null,
    occupantCount: params.occupantCount ?? null,
    vehiclePlate: params.vehiclePlate ?? null,
    direction: logDirection,
  }

  broadcastAccessEvent(accessEvent)
}

/** Check if token matches an active, non-expired resident pass */
async function validateResidentPass(
  token: string,
  tenantId: string,
  authorizedBy: string,
  direction: 'entry' | 'exit',
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
    .leftJoin(units, eq(units.id, residentPasses.unitId))
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

  if (direction === 'exit') {
    // Try to close an open entry
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

    // No open entry — still log exit (guard saw them leave)
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
      direction: 'exit',
    })

    return {
      status: 'valid',
      direction: 'exit',
      residentName: pass.userName,
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      isResidentPass: true,
    }
  }

  // direction === 'entry' — log access (multi-use, never mark as used)
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
  direction: 'entry' | 'exit',
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

  if (direction === 'exit') {
    // Try to close an open entry
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

    // No open entry — still log exit (guard saw them leave)
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
      direction: 'exit',
    })

    return {
      status: 'valid',
      direction: 'exit',
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      isMemberPass: true,
      memberName: pass.memberName,
      memberRelationship: pass.memberRelationship,
    }
  }

  // direction === 'entry' — log access (multi-use, never mark as used)
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
  direction: 'entry' | 'exit',
  occupantCount?: number,
): Promise<ValidationResult | null> {
  const { sql } = await import('drizzle-orm')

  const [pass] = await db
    .select({
      id: vehiclePasses.id,
      vehicleId: vehiclePasses.vehicleId,
      description: vehiclePasses.description,
      passType: vehiclePasses.passType,
      isActive: vehiclePasses.isActive,
      occupantLimit: vehiclePasses.occupantLimit,
      expiresAt: vehiclePasses.expiresAt,
      plate: vehicles.plate,
      brand: vehicles.brand,
      model: vehicles.model,
      color: vehicles.color,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(vehiclePasses)
    .leftJoin(vehicles, eq(vehicles.id, vehiclePasses.vehicleId))
    .leftJoin(units, sql`${units.id} = COALESCE(${vehicles.unitId}, ${vehiclePasses.unitId})`)
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

  const visitorName = pass.plate ? `Vehiculo ${pass.plate}` : (pass.description ?? 'Pase temporal')

  // Expired vehicle pass
  if (pass.expiresAt && pass.expiresAt <= now) {
    await logAccess({
      tenantId,
      entryType: 'qr',
      result: 'expired',
      authorizedBy,
      vehiclePassId: pass.id,
      visitorName,
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

  if (direction === 'exit') {
    // Try to close an open entry
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

    // No open entry — still log exit (guard saw them leave)
    await logAccess({
      tenantId,
      entryType: 'qr',
      result: 'allowed',
      authorizedBy,
      vehiclePassId: pass.id,
      occupantCount,
      visitorName,
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      vehiclePlate: pass.plate,
      passToken: token,
      direction: 'exit',
    })

    return {
      status: 'valid',
      direction: 'exit',
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

  // direction === 'entry'
  const needsUnit = pass.passType === 'temporary' && !pass.unitNumber

  if (needsUnit) {
    // Don't log access yet — guard must assign a unit first
    return {
      status: 'valid',
      direction: 'entry',
      unitNumber: null,
      unitLabel: null,
      expiresAt: pass.expiresAt?.toISOString(),
      isVehiclePass: true,
      vehiclePlate: pass.plate,
      vehicleBrand: pass.brand,
      vehicleModel: pass.model,
      vehicleColor: pass.color,
      passType: pass.passType,
      occupantLimit: pass.occupantLimit,
      requiresUnit: true,
      vehiclePassId: pass.id,
    }
  }

  // Log access (multi-use, never mark as used)
  await logAccess({
    tenantId,
    entryType: 'qr',
    result: 'allowed',
    authorizedBy,
    vehiclePassId: pass.id,
    occupantCount,
    visitorName,
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
  direction: 'entry' | 'exit',
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

  if (direction === 'exit') {
    // Try to close an open entry
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

    // No open entry — still log exit (guard saw them leave)
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
      direction: 'exit',
    })

    return {
      status: 'valid',
      direction: 'exit',
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      isStaffPass: true,
      staffName: pass.staffName,
      staffRole: pass.roleName ?? undefined,
    }
  }

  // direction === 'entry' — log access (multi-use, never mark as used)
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
  direction: 'entry' | 'exit',
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

  if (direction === 'exit') {
    // Try to close an open entry
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

    // No open entry — still log exit (guard saw them leave)
    await logAccess({
      tenantId,
      entryType: 'qr',
      result: 'allowed',
      authorizedBy,
      visitorName: `${member.name} (${member.role})`,
      passToken: token,
      direction: 'exit',
    })

    return {
      status: 'valid',
      direction: 'exit',
      isCondoStaff: true,
      staffName: member.name,
      staffRole: member.role,
    }
  }

  // direction === 'entry' — log access (multi-use, never expires)
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
