import { db } from '~~/server/db'
import { announcements } from '~~/server/db/schema/announcement'
import { eq, and } from 'drizzle-orm'
import { unlink } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de anuncio requerido' })
  }

  // Get announcement to check existence and get attachment path
  const [existing] = await db
    .select()
    .from(announcements)
    .where(and(
      eq(announcements.id, id),
      eq(announcements.tenantId, session.tenantId),
    ))

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Anuncio no encontrado' })
  }

  // Delete from DB
  await db
    .delete(announcements)
    .where(eq(announcements.id, id))

  // Remove PDF file if exists
  if (existing.attachmentPath) {
    const filePath = join(process.cwd(), 'uploads', 'announcements', existing.attachmentPath)
    await unlink(filePath).catch(() => {
      // File may not exist, ignore error
    })
  }

  return { success: true }
})
