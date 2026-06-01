import { db } from '~~/server/db'
import { regulations } from '~~/server/db/schema/regulation'
import { eq, and } from 'drizzle-orm'
import { readMultipartFormData } from 'h3'
import { mkdir, writeFile, unlink } from 'fs/promises'
import { join } from 'path'

const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  // Verify exists and belongs to tenant
  const rows = await db
    .select()
    .from(regulations)
    .where(and(eq(regulations.id, id), eq(regulations.tenantId, session.tenantId)))
    .limit(1)

  const existing = rows[0]
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Normativa no encontrada' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No se recibieron datos' })
  }

  let title = ''
  let displayOrder: number | undefined
  let pdfFile: { filename: string; data: Buffer; type: string } | null = null

  for (const part of formData) {
    if (part.name === 'title') {
      title = part.data.toString('utf-8').trim()
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

  if (!title) {
    throw createError({ statusCode: 400, message: 'El titulo es requerido' })
  }
  if (title.length > 200) {
    throw createError({ statusCode: 400, message: 'El titulo no puede exceder 200 caracteres' })
  }

  let attachmentPath = existing.attachmentPath

  // If new PDF provided, save and delete old
  if (pdfFile) {
    if (pdfFile.type !== 'application/pdf') {
      throw createError({ statusCode: 415, message: 'Solo se permiten archivos PDF' })
    }
    if (pdfFile.data.length > MAX_PDF_SIZE) {
      throw createError({ statusCode: 413, message: 'El archivo PDF no puede exceder 10MB' })
    }

    const uploadsDir = join(process.cwd(), 'uploads', 'regulations')
    await mkdir(uploadsDir, { recursive: true })

    const sanitizedName = pdfFile.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storedFileName = `${Date.now()}-${sanitizedName}`
    await writeFile(join(uploadsDir, storedFileName), pdfFile.data)

    // Delete old file
    if (existing.attachmentPath) {
      const oldPath = join(process.cwd(), 'uploads', 'regulations', existing.attachmentPath)
      await unlink(oldPath).catch(() => {})
    }

    attachmentPath = storedFileName
  }

  const updateValues: Record<string, unknown> = {
    title,
    attachmentPath,
    updatedAt: new Date(),
  }
  if (displayOrder !== undefined) {
    updateValues.displayOrder = displayOrder
  }

  const updated = await db
    .update(regulations)
    .set(updateValues)
    .where(eq(regulations.id, id))
    .returning()

  const row = updated[0]
  if (!row) {
    throw createError({ statusCode: 500, message: 'Error al actualizar' })
  }

  return {
    data: {
      id: row.id,
      title: row.title,
      attachmentPath: row.attachmentPath,
      authorId: row.authorId,
      tenantId: row.tenantId,
      publishedAt: row.publishedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  }
})
