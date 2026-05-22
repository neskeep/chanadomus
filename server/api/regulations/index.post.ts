import { db } from '~~/server/db'
import { regulations } from '~~/server/db/schema/regulation'
import { readMultipartFormData } from 'h3'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { sendPushToAll } from '~~/server/utils/web-push'
import type { Regulation } from '~~/shared/types/regulation'

const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No se recibieron datos del formulario' })
  }

  let title = ''
  let pdfFile: { filename: string; data: Buffer; type: string } | null = null

  for (const part of formData) {
    if (part.name === 'title') {
      title = part.data.toString('utf-8').trim()
    } else if (part.name === 'attachment' && part.data.length > 0) {
      pdfFile = {
        filename: part.filename ?? 'document.pdf',
        data: part.data,
        type: part.type ?? 'application/pdf',
      }
    }
  }

  if (!title) {
    throw createError({ statusCode: 400, message: 'El titulo es requerido' })
  }
  if (title.length > 200) {
    throw createError({ statusCode: 400, message: 'El titulo no puede exceder 200 caracteres' })
  }

  if (!pdfFile) {
    throw createError({ statusCode: 400, message: 'El archivo PDF es requerido' })
  }
  if (pdfFile.type !== 'application/pdf') {
    throw createError({ statusCode: 415, message: 'Solo se permiten archivos PDF' })
  }
  if (pdfFile.data.length > MAX_PDF_SIZE) {
    throw createError({ statusCode: 413, message: 'El archivo PDF no puede exceder 10MB' })
  }

  // Save PDF to disk
  const uploadsDir = join(process.cwd(), 'uploads', 'regulations')
  await mkdir(uploadsDir, { recursive: true })

  const sanitizedName = pdfFile.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storedFileName = `${Date.now()}-${sanitizedName}`
  await writeFile(join(uploadsDir, storedFileName), pdfFile.data)

  const rows = await db
    .insert(regulations)
    .values({
      title,
      attachmentPath: storedFileName,
      authorId: session.user.id,
      tenantId: session.tenantId,
    })
    .returning()

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 500, message: 'Error al crear la normativa' })
  }

  // Push notification
  await sendPushToAll(session.tenantId, {
    title: 'Nueva normativa publicada',
    body: title,
    url: '/mi-chana/normativas',
    category: 'announcement',
  }).catch(() => {})

  const regulation: Regulation = {
    id: row.id,
    title: row.title,
    attachmentPath: row.attachmentPath,
    authorId: row.authorId,
    authorName: session.user.name ?? undefined,
    tenantId: row.tenantId,
    publishedAt: row.publishedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }

  return { data: regulation }
})
