import { readFile, access } from 'fs/promises'
import { join } from 'path'

const EXTENSION_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const filename = getRouterParam(event, 'filename')
  if (!filename) {
    throw createError({ statusCode: 400, message: 'Nombre de archivo requerido' })
  }

  // Prevent directory traversal
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '')
  if (sanitized !== filename || filename.includes('..')) {
    throw createError({ statusCode: 400, message: 'Nombre de archivo invalido' })
  }

  const filePath = join(process.cwd(), 'uploads', 'support', filename)

  // Check file exists
  try {
    await access(filePath)
  } catch {
    throw createError({ statusCode: 404, message: 'Archivo no encontrado' })
  }

  const fileBuffer = await readFile(filePath)

  // Determine content type from extension
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase()
  const contentType = EXTENSION_TYPES[ext] ?? 'application/octet-stream'

  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setResponseHeader(event, 'Content-Disposition', `inline; filename="${filename}"`)

  return fileBuffer
})
