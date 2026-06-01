import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { polls } from '~~/server/db/schema/poll'
import { meetings } from '~~/server/db/schema/meeting'
import { regulations } from '~~/server/db/schema/regulation'
import { announcements } from '~~/server/db/schema/announcement'

const tableNames = ['polls', 'meetings', 'regulations', 'announcements'] as const

const reorderSchema = z.object({
  table: z.enum(tableNames),
  items: z.array(z.object({
    id: z.string().uuid(),
    displayOrder: z.number().int().min(0),
  })).min(1).max(500),
})

const tableMap = { polls, meetings, regulations, announcements } as const

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const { table, items } = await validateBody(event, reorderSchema)

  const drizzleTable = tableMap[table]

  await db.transaction(async (tx) => {
    for (const item of items) {
      await tx
        .update(drizzleTable)
        .set({ displayOrder: item.displayOrder })
        .where(
          and(
            eq(drizzleTable.id, item.id),
            eq(drizzleTable.tenantId, tenantId),
          ),
        )
    }
  })

  return { success: true }
})
