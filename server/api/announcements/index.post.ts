import { db } from '~~/server/db'
import { announcements } from '~~/server/db/schema/announcement'
import { readMultipartFormData } from 'h3'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { sendPushToAll } from '~~/server/utils/web-push'
import type { Announcement, AnnouncementCategory, AnnouncementStatus } from '~~/shared/types/announcement'

const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB
const VALID_CATEGORIES: AnnouncementCategory[] = ['general', 'mantenimiento', 'seguridad', 'financiero', 'evento', 'urgente']
const VALID_STATUSES: AnnouncementStatus[] = ['draft', 'published', 'archived']

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No se recibieron datos del formulario' })
  }

  // Extract fields from multipart data
  let title = ''
  let body = ''
  let category = ''
  let status = ''
  let expiresAt = ''
  let displayOrder = 0
  let pdfFile: { filename: string; data: Buffer; type: string } | null = null

  for (const part of formData) {
    if (part.name === 'title') {
      title = part.data.toString('utf-8').trim()
    } else if (part.name === 'body') {
      body = part.data.toString('utf-8').trim()
    } else if (part.name === 'category') {
      category = part.data.toString('utf-8').trim()
    } else if (part.name === 'status') {
      status = part.data.toString('utf-8').trim()
    } else if (part.name === 'expires_at') {
      expiresAt = part.data.toString('utf-8').trim()
    } else if (part.name === 'displayOrder') {
      const parsed = parseInt(part.data.toString('utf-8').trim(), 10)
      if (!isNaN(parsed) && parsed >= 0) displayOrder = parsed
    } else if (part.name === 'attachment' && part.data.length > 0) {
      pdfFile = {
        filename: part.filename ?? 'document.pdf',
        data: part.data,
        type: part.type ?? 'application/pdf',
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

  // Validate body
  if (!body) {
    throw createError({ statusCode: 400, message: 'El contenido es requerido' })
  }

  // Validate category
  if (!category) category = 'general'
  if (!VALID_CATEGORIES.includes(category as AnnouncementCategory)) {
    throw createError({ statusCode: 400, message: 'Categoria invalida' })
  }

  // Validate status
  if (!status) status = 'draft'
  if (!VALID_STATUSES.includes(status as AnnouncementStatus)) {
    throw createError({ statusCode: 400, message: 'Estado invalido' })
  }

  // Validate PDF
  if (pdfFile) {
    if (pdfFile.type !== 'application/pdf') {
      throw createError({ statusCode: 415, message: 'Solo se permiten archivos PDF' })
    }
    if (pdfFile.data.length > MAX_PDF_SIZE) {
      throw createError({ statusCode: 413, message: 'El archivo PDF no puede exceder 10MB' })
    }
  }

  // Validate expiresAt
  let expiresAtDate: Date | null = null
  if (expiresAt) {
    expiresAtDate = new Date(expiresAt)
    if (isNaN(expiresAtDate.getTime())) {
      throw createError({ statusCode: 400, message: 'Fecha de expiracion invalida' })
    }
  }

  // Save PDF to disk
  let attachmentPath: string | null = null
  if (pdfFile) {
    const uploadsDir = join(process.cwd(), 'uploads', 'announcements')
    await mkdir(uploadsDir, { recursive: true })

    const sanitizedName = pdfFile.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storedFileName = `${Date.now()}-${sanitizedName}`
    await writeFile(join(uploadsDir, storedFileName), pdfFile.data)
    attachmentPath = storedFileName
  }

  // Determine publishedAt
  const now = new Date()
  const publishedAt = status === 'published' ? now : null

  // Insert announcement
  const rows = await db
    .insert(announcements)
    .values({
      title,
      body,
      category: category as AnnouncementCategory,
      status: status as AnnouncementStatus,
      attachmentPath,
      displayOrder,
      authorId: session.user.id,
      tenantId: session.tenantId,
      publishedAt,
      expiresAt: expiresAtDate,
    })
    .returning()

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 500, message: 'Error al crear el anuncio' })
  }

  // Send push notification if published
  if (status === 'published') {
    await sendPushToAll(session.tenantId, {
      title: 'Nuevo anuncio',
      body: title,
      url: '/mi-chana/cartelera',
      category: 'announcement',
    }).catch(() => {
      // Push failure should not block the response
    })
  }

  const announcement: Announcement = {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    status: row.status,
    attachmentPath: row.attachmentPath,
    authorId: row.authorId,
    authorName: session.user.name ?? undefined,
    tenantId: row.tenantId,
    displayOrder: row.displayOrder,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }

  return { data: announcement }
})
