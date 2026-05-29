import { db } from '~~/server/db'
import { qrCodes } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import { residentPasses } from '~~/server/db/schema/resident-pass'
import { householdMemberPasses } from '~~/server/db/schema/household-member-pass'
import { householdMembers } from '~~/server/db/schema/household'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { vehicles } from '~~/server/db/schema/vehicle'
import { serviceStaffPasses } from '~~/server/db/schema/service-staff-pass'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { staff } from '~~/server/db/schema/staff'
import { user } from '~~/server/db/schema/auth'
import { eq, and, sql } from 'drizzle-orm'
import type { ValidationResult } from '~~/shared/types/qr'

/**
 * Public endpoint — no auth required.
 * Used by the /acceso/[token] page for visitors to view their QR status.
 * Does NOT log access or mark QR as used (that's done by vigilancia via /api/qr/validate).
 *
 * Searches all 6 pass/token tables sequentially:
 * 1. qrCodes (visitor QR)
 * 2. residentPasses
 * 3. householdMemberPasses
 * 4. vehiclePasses
 * 5. serviceStaffPasses
 * 6. staff (qrToken)
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ token: string }>(event)

  if (!body.token?.trim()) {
    throw createError({ statusCode: 400, message: 'token es requerido' })
  }

  const token = body.token.trim()

  // 1. Search qrCodes (visitor QR — single-use)
  const qrResult = await lookupQrCode(token)
  if (qrResult) return { data: qrResult }

  // 2. Search residentPasses
  const residentResult = await lookupResidentPass(token)
  if (residentResult) return { data: residentResult }

  // 3. Search householdMemberPasses
  const memberResult = await lookupMemberPass(token)
  if (memberResult) return { data: memberResult }

  // 4. Search vehiclePasses
  const vehicleResult = await lookupVehiclePass(token)
  if (vehicleResult) return { data: vehicleResult }

  // 5. Search serviceStaffPasses
  const staffPassResult = await lookupServiceStaffPass(token)
  if (staffPassResult) return { data: staffPassResult }

  // 6. Search staff (condo staff qrToken)
  const condoStaffResult = await lookupCondoStaff(token)
  if (condoStaffResult) return { data: condoStaffResult }

  // No match in any table
  const result: ValidationResult = { status: 'invalid' }
  return { data: result }
})

/** Lookup visitor QR code (single-use) */
async function lookupQrCode(token: string): Promise<ValidationResult | null> {
  const [record] = await db
    .select({
      visitorName: qrCodes.visitorName,
      visitorDocument: qrCodes.visitorDocument,
      visitorType: qrCodes.visitorType,
      expiresAt: qrCodes.expiresAt,
      usedAt: qrCodes.usedAt,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(qrCodes)
    .innerJoin(units, eq(units.id, qrCodes.unitId))
    .where(eq(qrCodes.token, token))
    .limit(1)

  if (!record) return null

  const now = new Date()

  if (record.usedAt) {
    return {
      status: 'already_used',
      visitorName: record.visitorName,
      unitNumber: record.unitNumber,
      usedAt: record.usedAt.toISOString(),
    }
  }

  if (record.expiresAt <= now) {
    return {
      status: 'expired',
      visitorName: record.visitorName,
      unitNumber: record.unitNumber,
    }
  }

  return {
    status: 'valid',
    visitorName: record.visitorName,
    visitorDocument: record.visitorDocument,
    visitorType: record.visitorType,
    unitNumber: record.unitNumber,
    unitLabel: record.unitLabel,
    expiresAt: record.expiresAt.toISOString(),
  }
}

/** Lookup active resident pass */
async function lookupResidentPass(token: string): Promise<ValidationResult | null> {
  const [pass] = await db
    .select({
      userName: user.name,
      expiresAt: residentPasses.expiresAt,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(residentPasses)
    .innerJoin(user, eq(user.id, residentPasses.userId))
    .leftJoin(units, eq(units.id, residentPasses.unitId))
    .where(
      and(
        eq(residentPasses.token, token),
        eq(residentPasses.isActive, true),
      ),
    )
    .limit(1)

  if (!pass) return null

  const now = new Date()

  if (pass.expiresAt <= now) {
    return {
      status: 'expired',
      residentName: pass.userName,
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      isResidentPass: true,
    }
  }

  return {
    status: 'valid',
    residentName: pass.userName,
    unitNumber: pass.unitNumber,
    unitLabel: pass.unitLabel,
    expiresAt: pass.expiresAt.toISOString(),
    isResidentPass: true,
  }
}

/** Lookup active household member pass */
async function lookupMemberPass(token: string): Promise<ValidationResult | null> {
  const [pass] = await db
    .select({
      memberName: householdMembers.name,
      memberRelationship: householdMembers.relationship,
      expiresAt: householdMemberPasses.expiresAt,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(householdMemberPasses)
    .innerJoin(householdMembers, eq(householdMembers.id, householdMemberPasses.memberId))
    .innerJoin(units, eq(units.id, householdMemberPasses.unitId))
    .where(
      and(
        eq(householdMemberPasses.token, token),
        eq(householdMemberPasses.isActive, true),
      ),
    )
    .limit(1)

  if (!pass) return null

  const now = new Date()

  if (pass.expiresAt && pass.expiresAt <= now) {
    return {
      status: 'expired',
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      isMemberPass: true,
      memberName: pass.memberName,
      memberRelationship: pass.memberRelationship,
    }
  }

  return {
    status: 'valid',
    unitNumber: pass.unitNumber,
    unitLabel: pass.unitLabel,
    expiresAt: pass.expiresAt?.toISOString(),
    isMemberPass: true,
    memberName: pass.memberName,
    memberRelationship: pass.memberRelationship,
  }
}

/** Lookup active vehicle pass */
async function lookupVehiclePass(token: string): Promise<ValidationResult | null> {
  const [pass] = await db
    .select({
      plate: vehicles.plate,
      brand: vehicles.brand,
      model: vehicles.model,
      color: vehicles.color,
      passType: vehiclePasses.passType,
      occupantLimit: vehiclePasses.occupantLimit,
      expiresAt: vehiclePasses.expiresAt,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(vehiclePasses)
    .leftJoin(vehicles, eq(vehicles.id, vehiclePasses.vehicleId))
    .leftJoin(units, sql`${units.id} = COALESCE(${vehicles.unitId}, ${vehiclePasses.unitId})`)
    .where(
      and(
        eq(vehiclePasses.token, token),
        eq(vehiclePasses.isActive, true),
      ),
    )
    .limit(1)

  if (!pass) return null

  const now = new Date()

  if (pass.expiresAt && pass.expiresAt <= now) {
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

/** Lookup active service staff pass */
async function lookupServiceStaffPass(token: string): Promise<ValidationResult | null> {
  const [pass] = await db
    .select({
      staffName: unitServiceStaff.name,
      roleName: serviceStaffRoles.name,
      expiresAt: serviceStaffPasses.expiresAt,
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
        eq(serviceStaffPasses.isActive, true),
      ),
    )
    .limit(1)

  if (!pass) return null

  const now = new Date()

  if (pass.expiresAt && pass.expiresAt <= now) {
    return {
      status: 'expired',
      unitNumber: pass.unitNumber,
      unitLabel: pass.unitLabel,
      isStaffPass: true,
      staffName: pass.staffName,
      staffRole: pass.roleName ?? undefined,
    }
  }

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

/** Lookup active condo staff by qrToken */
async function lookupCondoStaff(token: string): Promise<ValidationResult | null> {
  const [member] = await db
    .select({
      name: staff.name,
      role: staff.role,
    })
    .from(staff)
    .where(
      and(
        eq(staff.qrToken, token),
        eq(staff.isActive, true),
      ),
    )
    .limit(1)

  if (!member) return null

  return {
    status: 'valid',
    isCondoStaff: true,
    staffName: member.name,
    staffRole: member.role,
  }
}
