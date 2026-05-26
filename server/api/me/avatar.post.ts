import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { readMultipartFormData } from 'h3'
import { mkdir, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { eq } from 'drizzle-orm'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  // Solo admin y propietario pueden cambiar su avatar
  const userRole = session.user.role
  if (userRole !== 'admin' && userRole !== 'propietario') {
    throw createError({ statusCode: 403, message: 'No tienes permisos para cambiar tu foto de perfil' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No se recibió archivo' })
  }

  const filePart = formData.find(p => p.name === 'file')
  if (!filePart || !filePart.data || filePart.data.length === 0) {
    throw createError({ statusCode: 400, message: 'El archivo es requerido' })
  }

  if (!filePart.type || !ALLOWED_TYPES.includes(filePart.type)) {
    throw createError({ statusCode: 415, message: 'Solo se permiten imágenes JPG, PNG o WebP' })
  }

  if (filePart.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 413, message: 'La imagen excede el límite de 2MB' })
  }

  // Determine extension
  const ext = filePart.type === 'image/jpeg' ? 'jpg' : filePart.type === 'image/png' ? 'png' : 'webp'
  const storedFileName = `${session.user.id}-${Date.now()}.${ext}`

  const uploadsDir = join(process.cwd(), 'uploads', 'avatars')
  await mkdir(uploadsDir, { recursive: true })
  await writeFile(join(uploadsDir, storedFileName), filePart.data)

  // Get current image to delete old local avatar
  const [current] = await db
    .select({ image: user.image })
    .from(user)
    .where(eq(user.id, session.user.id))

  if (current?.image?.startsWith('/api/me/avatar/')) {
    const oldFile = current.image.replace('/api/me/avatar/', '')
    try { await unlink(join(uploadsDir, oldFile)) } catch { /* old file may not exist */ }
  }

  // Update user image path
  const imagePath = `/api/me/avatar/${storedFileName}`
  await db
    .update(user)
    .set({ image: imagePath, updatedAt: new Date() })
    .where(eq(user.id, session.user.id))

  return { data: { image: imagePath } }
})
