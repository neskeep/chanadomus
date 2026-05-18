import { db } from '~~/server/db'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin'])
  const tenantId = (session.user as Record<string, unknown>).tenantId as string

  const rows = await db
    .select()
    .from(serviceStaffRoles)
    .where(eq(serviceStaffRoles.tenantId, tenantId))
    .orderBy(asc(serviceStaffRoles.name))

  return { data: rows }
})
