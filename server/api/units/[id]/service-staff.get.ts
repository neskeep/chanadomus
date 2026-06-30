import { db } from '~~/server/db'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { serviceStaffPasses } from '~~/server/db/schema/service-staff-pass'
import { staff } from '~~/server/db/schema/staff'
import { residentPasses } from '~~/server/db/schema/resident-pass'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const unitId = getRouterParam(event, 'id')
  if (!unitId) {
    throw createError({ statusCode: 400, message: 'Unit ID is required' })
  }

  // Service staff (jardinero, doméstica, etc.) from unit_service_staff
  const serviceRows = await db
    .select({
      id: unitServiceStaff.id,
      unitId: unitServiceStaff.unitId,
      name: unitServiceStaff.name,
      roleId: unitServiceStaff.roleId,
      roleName: serviceStaffRoles.name,
      idDocument: unitServiceStaff.idDocument,
      phone: unitServiceStaff.phone,
      isActive: unitServiceStaff.isActive,
      tenantId: unitServiceStaff.tenantId,
      createdAt: unitServiceStaff.createdAt,
      passToken: serviceStaffPasses.token,
    })
    .from(unitServiceStaff)
    .leftJoin(serviceStaffRoles, eq(unitServiceStaff.roleId, serviceStaffRoles.id))
    .leftJoin(
      serviceStaffPasses,
      and(
        eq(serviceStaffPasses.staffId, unitServiceStaff.id),
        eq(serviceStaffPasses.isActive, true),
      ),
    )
    .where(
      and(
        eq(unitServiceStaff.unitId, unitId),
        eq(unitServiceStaff.tenantId, tenantId),
        eq(unitServiceStaff.isActive, true),
      ),
    )
    .orderBy(asc(serviceStaffRoles.displayOrder), asc(serviceStaffRoles.name), asc(unitServiceStaff.name))

  // Conserjes assigned to this unit (from staff table)
  const conserjeRows = await db
    .select({
      id: staff.id,
      unitId: staff.unitId,
      name: staff.name,
      idDocument: staff.idDocument,
      phone: staff.phone,
      isActive: staff.isActive,
      tenantId: staff.tenantId,
      createdAt: staff.createdAt,
      qrToken: staff.qrToken,
      residentPassToken: residentPasses.token,
    })
    .from(staff)
    .leftJoin(
      residentPasses,
      and(
        eq(residentPasses.userId, staff.userId),
        eq(residentPasses.tenantId, staff.tenantId),
        eq(residentPasses.isActive, true),
      ),
    )
    .where(
      and(
        eq(staff.unitId, unitId),
        eq(staff.tenantId, tenantId),
        eq(staff.role, 'conserje'),
        eq(staff.isActive, true),
      ),
    )
    .orderBy(asc(staff.name))

  const data = [
    ...conserjeRows.map((row) => {
      const token = row.qrToken || row.residentPassToken || null
      return {
        id: row.id,
        unitId: row.unitId,
        name: row.name,
        idDocument: row.idDocument,
        phone: row.phone,
        isActive: row.isActive,
        tenantId: row.tenantId,
        createdAt: row.createdAt,
        roleId: null as string | null,
        roleName: 'Conserje',
        passToken: token,
        hasPass: !!token,
        source: 'staff' as const,
      }
    }),
    ...serviceRows.map(row => ({
      ...row,
      passToken: row.passToken ?? null,
      hasPass: !!row.passToken,
      source: 'unit' as const,
    })),
  ]

  return { data }
})
