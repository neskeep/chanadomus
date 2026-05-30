import { db } from '~~/server/db'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { tenantId } = session

  const rows = await db
    .select()
    .from(serviceStaffRoles)
    .where(and(
      eq(serviceStaffRoles.tenantId, tenantId),
      eq(serviceStaffRoles.isActive, true),
    ))
    .orderBy(asc(serviceStaffRoles.displayOrder), asc(serviceStaffRoles.name))

  return { data: rows }
})
