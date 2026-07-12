import { db } from '~~/server/db'
import { supportTickets, supportTicketScreenshots } from '~~/server/db/schema/support'
import { user } from '~~/server/db/schema/auth'
import { eq } from 'drizzle-orm'
import { readMultipartFormData } from 'h3'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { sendPushToRole } from '~~/server/utils/web-push'
import type { SupportTicket, SupportTicketType, SupportTicketPriority } from '~~/shared/types/support'
import { SUPPORT_TICKET_TYPES, SUPPORT_TICKET_PRIORITIES } from '~~/shared/types/support'

const MAX_SCREENSHOT_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SCREENSHOTS = 3

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No se recibieron datos del formulario' })
  }

  // Extract fields from multipart data
  let title = ''
  let description = ''
  let type = ''
  let priority = ''
  let pageUrl = ''
  let userAgent = ''
  const screenshots: { filename: string; data: Buffer; type: string }[] = []

  for (const part of formData) {
    if (part.name === 'title') {
      title = part.data.toString('utf-8').trim()
    } else if (part.name === 'description') {
      description = part.data.toString('utf-8').trim()
    } else if (part.name === 'type') {
      type = part.data.toString('utf-8').trim()
    } else if (part.name === 'priority') {
      priority = part.data.toString('utf-8').trim()
    } else if (part.name === 'pageUrl') {
      pageUrl = part.data.toString('utf-8').trim()
    } else if (part.name === 'userAgent') {
      userAgent = part.data.toString('utf-8').trim()
    } else if (part.name?.startsWith('screenshot_') && part.data.length > 0) {
      if (screenshots.length < MAX_SCREENSHOTS) {
        screenshots.push({
          filename: part.filename ?? 'screenshot.jpg',
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

  // Validate type
  if (!SUPPORT_TICKET_TYPES.includes(type as SupportTicketType)) {
    throw createError({ statusCode: 400, message: 'El tipo debe ser: bug, sugerencia o pregunta' })
  }

  // Validate priority
  if (!SUPPORT_TICKET_PRIORITIES.includes(priority as SupportTicketPriority)) {
    throw createError({ statusCode: 400, message: 'La prioridad debe ser: baja, media, alta o critica' })
  }

  // Validate screenshots
  for (const screenshot of screenshots) {
    if (!ALLOWED_TYPES.includes(screenshot.type)) {
      throw createError({ statusCode: 415, message: `Tipo de imagen no permitido: ${screenshot.type}. Solo JPEG, PNG y WebP` })
    }
    if (screenshot.data.length > MAX_SCREENSHOT_SIZE) {
      throw createError({ statusCode: 413, message: 'Cada screenshot no puede exceder 10MB' })
    }
  }

  // Get user name for push notification
  const [userData] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, session.user.id))

  // Save screenshots to disk
  const uploadsDir = join(process.cwd(), 'uploads', 'support')
  await mkdir(uploadsDir, { recursive: true })

  const savedScreenshots: string[] = []
  for (const screenshot of screenshots) {
    const sanitizedName = screenshot.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storedFileName = `${Date.now()}-${sanitizedName}`
    await writeFile(join(uploadsDir, storedFileName), screenshot.data)
    savedScreenshots.push(storedFileName)
  }

  // Insert ticket
  const rows = await db
    .insert(supportTickets)
    .values({
      title,
      description,
      type: type as SupportTicketType,
      priority: priority as SupportTicketPriority,
      status: 'nuevo',
      pageUrl: pageUrl || null,
      userAgent: userAgent || null,
      isPublic: false,
      reportedById: session.user.id,
      tenantId: session.tenantId,
    })
    .returning()

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 500, message: 'Error al crear el ticket de soporte' })
  }

  // Insert screenshot records
  if (savedScreenshots.length > 0) {
    await db.insert(supportTicketScreenshots).values(
      savedScreenshots.map((filePath) => ({
        ticketId: row.id,
        filePath,
      })),
    )
  }

  // Send push to admins
  const userName = userData?.name ?? 'Un usuario'
  await sendPushToRole(session.tenantId, 'admin', {
    title: 'Nuevo ticket de soporte',
    body: `${userName} reporto: ${title}`,
    url: '/admin/soporte',
    category: 'soporte',
  }).catch(() => {
    // Push failure should not block the response
  })

  const ticket: SupportTicket = {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    priority: row.priority,
    status: row.status,
    reportedById: row.reportedById,
    pageUrl: row.pageUrl,
    userAgent: row.userAgent,
    resolvedInVersion: row.resolvedInVersion,
    isPublic: row.isPublic,
    tenantId: row.tenantId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: null,
  }

  return { data: ticket }
})
