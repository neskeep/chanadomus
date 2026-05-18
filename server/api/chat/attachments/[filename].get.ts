import { createReadStream, existsSync } from 'fs'
import { join } from 'path'
import { sendStream, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  // Auth check — only authenticated users can view chat images
  await requireTenant(event)

  const filename = getRouterParam(event, 'filename')
  if (!filename) {
    throw createError({ statusCode: 400, message: 'Filename requerido' })
  }

  // Sanitize — prevent directory traversal
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '')
  if (sanitized !== filename || filename.includes('..')) {
    throw createError({ statusCode: 400, message: 'Nombre de archivo inválido' })
  }

  const filePath = join(process.cwd(), 'uploads', 'chat', sanitized)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, message: 'Archivo no encontrado' })
  }

  setHeader(event, 'Content-Type', 'image/webp')
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  return sendStream(event, createReadStream(filePath))
})
