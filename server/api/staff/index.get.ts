import { db } from '~~/server/db'
import { staff } from '~~/server/db/schema/staff'
import { units } from '~~/server/db/schema/unit'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const query = getQuery(event)
  const roleId = query.roleId as string | undefined

  const conditions = [
    eq(staff.tenantId, tenantId),
    eq(staff.isActive, true),
  ]

  if (roleId) {
    conditions.push(eq(staff.roleId, roleId))
  }

  const rows = await db
    .select({
      id: staff.id,
      name: staff.name,
      role: staff.role,
      roleId: staff.roleId,
      roleName: serviceStaffRoles.name,
      idDocument: staff.idDocument,
      phone: staff.phone,
      email: staff.email,
      shift: staff.shift,
      isActive: staff.isActive,
      avatar: staff.avatar,
      qrToken: staff.qrToken,
      userId: staff.userId,
      unitId: staff.unitId,
      tenantId: staff.tenantId,
      createdAt: staff.createdAt,
      unitNumber: units.number,
      unitLabel: units.label,
    })
    .from(staff)
    .leftJoin(units, eq(units.id, staff.unitId))
    .leftJoin(serviceStaffRoles, eq(serviceStaffRoles.id, staff.roleId))
    .where(and(...conditions))
    .orderBy(asc(serviceStaffRoles.displayOrder), asc(serviceStaffRoles.name), asc(staff.name))

  return { data: rows }
})
