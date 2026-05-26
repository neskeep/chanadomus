import { db } from '~~/server/db'
import { incidents, incidentPhotos } from '~~/server/db/schema/incident'
import { user } from '~~/server/db/schema/auth'
import { eq } from 'drizzle-orm'
import { readMultipartFormData } from 'h3'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { sendPushToRole } from '~~/server/utils/web-push'
import type { Incident, IncidentPriority } from '~~/shared/types/incident'

const MAX_PHOTO_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTOS = 3
const VALID_PRIORITIES: IncidentPriority[] = ['low', 'medium', 'high']

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const userRole = await requireRole(event, ['propietario', 'vigilancia', 'conserje'])

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No se recibieron datos del formulario' })
  }

  // Extract fields from multipart data
  let title = ''
  let description = ''
  let priority = ''
  let isAnonymous = false
  let formUnitId = ''
  const photos: { filename: string; data: Buffer; type: string }[] = []

  for (const part of formData) {
    if (part.name === 'title') {
      title = part.data.toString('utf-8').trim()
    } else if (part.name === 'description') {
      description = part.data.toString('utf-8').trim()
    } else if (part.name === 'priority') {
      priority = part.data.toString('utf-8').trim()
    } else if (part.name === 'is_anonymous') {
      isAnonymous = part.data.toString('utf-8').trim() === 'true'
    } else if (part.name === 'unit_id') {
      formUnitId = part.data.toString('utf-8').trim()
    } else if (part.name?.startsWith('photo_') && part.data.length > 0) {
      if (photos.length < MAX_PHOTOS) {
        photos.push({
          filename: part.filename ?? 'photo.jpg',
          data: part.data,
          type: part.type ?? 'image/jpeg',
        })
      }
    }
  }

  // Validate title
  if (!title) {
    throw createError({ statusCode: 400, message: 'El titulo es requerido' })
  }
  if (title.length > 200) {
    throw createError({ statusCode: 400, message: 'El titulo no puede exceder 200 caracteres' })
  }

  // Validate description
  if (!description) {
    throw createError({ statusCode: 400, message: 'La descripcion es requerida' })
  }

  // Validate priority
  if (!VALID_PRIORITIES.includes(priority as IncidentPriority)) {
    throw createError({ statusCode: 400, message: 'La prioridad debe ser low, medium o high' })
  }

  // Validate photos
  for (const photo of photos) {
    if (!ALLOWED_TYPES.includes(photo.type)) {
      throw createError({ statusCode: 415, message: `Tipo de imagen no permitido: ${photo.type}. Solo JPEG, PNG y WebP` })
    }
    if (photo.data.length > MAX_PHOTO_SIZE) {
      throw createError({ statusCode: 413, message: 'Cada foto no puede exceder 5MB' })
    }
  }

  // Get user's unitId — vigilancia passes unit_id in form, propietario uses their assigned unit
  const [userData] = await db
    .select({ unitId: user.unitId, name: user.name })
    .from(user)
    .where(eq(user.id, session.user.id))

  const resolvedUnitId = formUnitId || userData?.unitId || null

  // Save photos to disk
  const uploadsDir = join(process.cwd(), 'uploads', 'incidents')
  await mkdir(uploadsDir, { recursive: true })

  const savedPhotos: string[] = []
  for (const photo of photos) {
    const sanitizedName = photo.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storedFileName = `${Date.now()}-${sanitizedName}`
    await writeFile(join(uploadsDir, storedFileName), photo.data)
    savedPhotos.push(storedFileName)
  }

  // Insert incident
  const rows = await db
    .insert(incidents)
    .values({
      title,
      description,
      priority: priority as IncidentPriority,
      status: 'open',
      isAnonymous,
      reportedById: session.user.id,
      unitId: resolvedUnitId,
      tenantId: session.tenantId,
    })
    .returning()

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 500, message: 'Error al crear la incidencia' })
  }

  // Insert photo records
  if (savedPhotos.length > 0) {
    await db.insert(incidentPhotos).values(
      savedPhotos.map((filePath) => ({
        incidentId: row.id,
        filePath,
      })),
    )
  }

  // Send push to admins (admin always sees reporter, even for anonymous)
  const userName = userData?.name ?? (userRole.user.role === 'vigilancia' ? 'Vigilancia' : userRole.user.role === 'conserje' ? 'Conserjería' : 'Un propietario')
  const pushBody = isAnonymous
    ? `Reporte anónimo: ${title}`
    : `${userName} reportó: ${title}`
  await sendPushToRole(session.tenantId, 'admin', {
    title: 'Nueva incidencia',
    body: pushBody,
    url: '/admin/incidencias',
    category: 'incident',
  }).catch(() => {
    // Push failure should not block the response
  })

  const incident: Incident = {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    isAnonymous: row.isAnonymous,
    reportedById: row.reportedById,
    unitId: row.unitId,
    tenantId: row.tenantId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: null,
  }

  return { data: incident }
})
