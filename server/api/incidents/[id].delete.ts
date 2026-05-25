import { db } from '~~/server/db'
import { incidents, incidentPhotos } from '~~/server/db/schema/incident'
import { eq, and } from 'drizzle-orm'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de incidencia requerido' })
  }

  // Get incident (tenant-scoped)
  const [incident] = await db
    .select()
    .from(incidents)
    .where(and(
      eq(incidents.id, id),
      eq(incidents.tenantId, session.tenantId),
    ))

  if (!incident) {
    throw createError({ statusCode: 404, message: 'Incidencia no encontrada' })
  }

  // Get photos to delete from disk
  const photos = await db
    .select({ filePath: incidentPhotos.filePath })
    .from(incidentPhotos)
    .where(eq(incidentPhotos.incidentId, id))

  // Delete incident (cascade deletes photos + updates records)
  await db.delete(incidents).where(eq(incidents.id, id))

  // Clean up photo files from disk
  for (const photo of photos) {
    const filePath = join('uploads', 'incidents', photo.filePath)
    await unlink(filePath).catch(() => {
      // File may not exist, ignore
    })
  }

  return { success: true }
})
