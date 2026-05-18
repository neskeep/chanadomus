import { readMultipartFormData } from 'h3'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { db } from '~~/server/db'
import { messages, chatAttachments } from '~~/server/db/schema/chat'
import { user } from '~~/server/db/schema/auth'
import { eq } from 'drizzle-orm'
import { userCanAccessRoom, broadcastToRoom } from '~~/server/utils/ws-chat'
import { processImageToWebP } from '~~/server/utils/image-processing'
import type { ChatMessage, ChatAttachment } from '~~/shared/types/chat'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB raw input (before compression)
const MAX_IMAGES = 5
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
  'image/heif', 'image/avif', 'image/tiff', 'image/gif',
]

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No se recibieron datos' })
  }

  // Extract fields
  let roomId = ''
  let content = ''
  const imageFiles: { filename: string; data: Buffer; type: string }[] = []

  for (const part of formData) {
    if (part.name === 'roomId') {
      roomId = part.data.toString('utf-8').trim()
    } else if (part.name === 'content') {
      content = part.data.toString('utf-8').trim()
    } else if (part.name?.startsWith('image_') && part.data.length > 0) {
      if (imageFiles.length < MAX_IMAGES) {
        imageFiles.push({
          filename: part.filename ?? 'image.jpg',
          data: part.data,
          type: part.type ?? 'image/jpeg',
        })
      }
    }
  }

  if (!roomId) {
    throw createError({ statusCode: 400, message: 'roomId es requerido' })
  }

  if (imageFiles.length === 0) {
    throw createError({ statusCode: 400, message: 'Al menos una imagen es requerida' })
  }

  // Validate images
  for (const img of imageFiles) {
    if (!ALLOWED_TYPES.includes(img.type)) {
      throw createError({ statusCode: 415, message: `Tipo no permitido: ${img.type}` })
    }
    if (img.data.length > MAX_IMAGE_SIZE) {
      throw createError({ statusCode: 413, message: 'Cada imagen no puede exceder 10MB' })
    }
  }

  // Validate room access
  const [userData] = await db
    .select({ id: user.id, name: user.name, image: user.image, role: user.role, unitId: user.unitId })
    .from(user)
    .where(eq(user.id, session.user.id))

  if (!userData) {
    throw createError({ statusCode: 403, message: 'Usuario no encontrado' })
  }

  const hasAccess = await userCanAccessRoom(
    roomId,
    userData.id,
    userData.role ?? 'propietario',
    session.tenantId,
    userData.unitId,
  )

  if (!hasAccess) {
    throw createError({ statusCode: 403, message: 'Sin acceso a esta sala' })
  }

  // Process and save images
  const uploadsDir = join(process.cwd(), 'uploads', 'chat')
  await mkdir(uploadsDir, { recursive: true })

  const processedFiles: { filePath: string; width: number; height: number; fileSize: number }[] = []

  for (const img of imageFiles) {
    const processed = await processImageToWebP(img.data)
    const storedFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
    await writeFile(join(uploadsDir, storedFileName), processed.buffer)
    processedFiles.push({
      filePath: storedFileName,
      width: processed.width,
      height: processed.height,
      fileSize: processed.size,
    })
  }

  // Insert message (content can be empty for image-only messages)
  const messageContent = content || ''
  const [insertedMessage] = await db
    .insert(messages)
    .values({ roomId, userId: session.user.id, content: messageContent })
    .returning()

  if (!insertedMessage) {
    throw createError({ statusCode: 500, message: 'Error al crear mensaje' })
  }

  // Insert attachments
  const attachmentRows = await db
    .insert(chatAttachments)
    .values(processedFiles.map(f => ({
      messageId: insertedMessage.id,
      filePath: f.filePath,
      width: f.width,
      height: f.height,
      fileSize: f.fileSize,
    })))
    .returning()

  // Build response and broadcast
  const attachmentData: ChatAttachment[] = attachmentRows.map(a => ({
    id: a.id,
    filePath: a.filePath,
    width: a.width,
    height: a.height,
    fileSize: a.fileSize,
  }))

  const chatMessage: ChatMessage = {
    id: insertedMessage.id,
    roomId: insertedMessage.roomId,
    userId: insertedMessage.userId,
    content: insertedMessage.content,
    createdAt: insertedMessage.createdAt.toISOString(),
    attachments: attachmentData,
    user: { id: userData.id, name: userData.name, image: userData.image },
  }

  // Broadcast to all WS peers in the room
  broadcastToRoom(roomId, JSON.stringify({ type: 'message', data: chatMessage }))

  return { data: chatMessage }
})
