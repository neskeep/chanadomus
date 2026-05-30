import { db } from '~~/server/db'
import { staff } from '~~/server/db/schema/staff'
import { readMultipartFormData } from 'h3'
import { mkdir, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { eq, and } from 'drizzle-orm'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  // Verify staff exists and belongs to tenant
  const [existing] = await db
    .select({ id: staff.id, avatar: staff.avatar })
    .from(staff)
    .where(and(eq(staff.id, id), eq(staff.tenantId, tenantId)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Personal no encontrado' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No se recibio archivo' })
  }

  const filePart = formData.find(p => p.name === 'file')
  if (!filePart || !filePart.data || filePart.data.length === 0) {
    throw createError({ statusCode: 400, message: 'El archivo es requerido' })
  }

  if (!filePart.type || !ALLOWED_TYPES.includes(filePart.type)) {
    throw createError({ statusCode: 415, message: 'Solo se permiten imagenes JPG, PNG o WebP' })
  }

  if (filePart.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 413, message: 'La imagen excede el limite de 2MB' })
  }

  // Determine extension
  const ext = filePart.type === 'image/jpeg' ? 'jpg' : filePart.type === 'image/png' ? 'png' : 'webp'
  const storedFileName = `staff-${id}-${Date.now()}.${ext}`

  const uploadsDir = join(process.cwd(), 'uploads', 'avatars')
  await mkdir(uploadsDir, { recursive: true })
  await writeFile(join(uploadsDir, storedFileName), filePart.data)

  // Delete old avatar if exists
  if (existing.avatar?.startsWith(`/api/staff/${id}/avatar/`)) {
    const oldFile = existing.avatar.replace(`/api/staff/${id}/avatar/`, '')
    try { await unlink(join(uploadsDir, oldFile)) } catch { /* old file may not exist */ }
  }

  // Update staff avatar path
  const imagePath = `/api/staff/${id}/avatar/${storedFileName}`
  await db
    .update(staff)
    .set({ avatar: imagePath })
    .where(and(eq(staff.id, id), eq(staff.tenantId, tenantId)))

  return { data: { avatar: imagePath } }
})
