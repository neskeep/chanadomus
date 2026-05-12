import { createReadStream, existsSync } from 'fs'
import { join } from 'path'
import { sendStream } from 'h3'

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')
  if (!filename) {
    throw createError({ statusCode: 400, message: 'Filename requerido' })
  }

  // Prevent path traversal
  if (filename.includes('..') || filename.includes('/')) {
    throw createError({ statusCode: 400, message: 'Nombre de archivo inválido' })
  }

  const filePath = join(process.cwd(), 'uploads', 'avatars', filename)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, message: 'Avatar no encontrado' })
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'

  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')

  return sendStream(event, createReadStream(filePath))
})
