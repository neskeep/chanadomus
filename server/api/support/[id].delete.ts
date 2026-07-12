import { db } from '~~/server/db'
import { supportTickets, supportTicketScreenshots } from '~~/server/db/schema/support'
import { eq, and } from 'drizzle-orm'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de ticket requerido' })
  }

  // Get ticket (tenant-scoped)
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(and(
      eq(supportTickets.id, id),
      eq(supportTickets.tenantId, session.tenantId),
    ))

  if (!ticket) {
    throw createError({ statusCode: 404, message: 'Ticket no encontrado' })
  }

  // Get screenshots to delete from disk
  const screenshots = await db
    .select({ filePath: supportTicketScreenshots.filePath })
    .from(supportTicketScreenshots)
    .where(eq(supportTicketScreenshots.ticketId, id))

  // Delete ticket (cascade deletes screenshots + updates records)
  await db.delete(supportTickets).where(eq(supportTickets.id, id))

  // Clean up screenshot files from disk
  for (const screenshot of screenshots) {
    const filePath = join('uploads', 'support', screenshot.filePath)
    await unlink(filePath).catch(() => {
      // File may not exist, ignore
    })
  }

  return { success: true }
})
