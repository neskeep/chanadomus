import { db } from '~~/server/db'
import { units } from '~~/server/db/schema/unit'
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenant(event)

  const rows = await db
    .select({
      id: units.id,
      number: units.number,
      label: units.label,
    })
    .from(units)
    .where(eq(units.tenantId, tenantId))
    .orderBy(asc(units.number))

  return { data: rows }
})
