import { db } from '~~/server/db'
import { regulations } from '~~/server/db/schema/regulation'
import { eq, and } from 'drizzle-orm'
import { unlink } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  const rows = await db
    .select()
    .from(regulations)
    .where(and(eq(regulations.id, id), eq(regulations.tenantId, session.tenantId)))
    .limit(1)

  const regulation = rows[0]
  if (!regulation) {
    throw createError({ statusCode: 404, message: 'Normativa no encontrada' })
  }

  // Delete file from disk
  if (regulation.attachmentPath) {
    const filePath = join(process.cwd(), 'uploads', 'regulations', regulation.attachmentPath)
    await unlink(filePath).catch(() => {})
  }

  await db
    .delete(regulations)
    .where(eq(regulations.id, id))

  return { success: true }
})
