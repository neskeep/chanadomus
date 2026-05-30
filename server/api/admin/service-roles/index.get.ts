import { db } from '~~/server/db'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const query = getQuery(event)
  const includeInactive = query.includeInactive === 'true'

  const conditions = [eq(serviceStaffRoles.tenantId, tenantId)]
  if (!includeInactive) {
    conditions.push(eq(serviceStaffRoles.isActive, true))
  }

  const rows = await db
    .select()
    .from(serviceStaffRoles)
    .where(and(...conditions))
    .orderBy(asc(serviceStaffRoles.displayOrder), asc(serviceStaffRoles.name))

  return { data: rows }
})
