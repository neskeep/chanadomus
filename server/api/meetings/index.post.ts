import { db } from '~~/server/db'
import { meetings } from '~~/server/db/schema/meeting'
import { sendPushToAll } from '~~/server/utils/web-push'
import type { Meeting, MeetingType, CreateMeeting } from '~~/shared/types/meeting'

const VALID_TYPES: MeetingType[] = ['ordinaria', 'extraordinaria', 'comite', 'informativa']

function mapMeeting(row: Record<string, unknown>): Meeting {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    date: (row.date as Date).toISOString(),
    endDate: row.endDate ? (row.endDate as Date).toISOString() : null,
    location: row.location as string | null,
    meetingLink: row.meetingLink as string | null,
    type: row.type as MeetingType,
    status: row.status as string as Meeting['status'],
    agenda: row.agenda as string | null,
    minutes: row.minutes as string | null,
    createdById: row.createdById as string,
    tenantId: row.tenantId as string,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const body = await readBody<CreateMeeting>(event)

  // Validate required fields
  if (!body.title || !body.title.trim()) {
    throw createError({ statusCode: 400, message: 'El titulo es requerido' })
  }
  if (body.title.trim().length > 200) {
    throw createError({ statusCode: 400, message: 'El titulo no puede exceder 200 caracteres' })
  }
  if (!body.date) {
    throw createError({ statusCode: 400, message: 'La fecha es requerida' })
  }

  const meetingDate = new Date(body.date)
  if (isNaN(meetingDate.getTime())) {
    throw createError({ statusCode: 400, message: 'Fecha invalida' })
  }
  if (meetingDate <= new Date()) {
    throw createError({ statusCode: 400, message: 'La fecha debe ser futura' })
  }

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    throw createError({ statusCode: 400, message: 'El tipo de reunion es requerido y debe ser valido' })
  }

  // Validate optional endDate
  let endDate: Date | null = null
  if (body.endDate) {
    endDate = new Date(body.endDate)
    if (isNaN(endDate.getTime())) {
      throw createError({ statusCode: 400, message: 'Fecha de fin invalida' })
    }
  }

  // Validate meetingLink if provided
  const meetingLink = body.meetingLink?.trim() || null

  const rows = await db
    .insert(meetings)
    .values({
      title: body.title.trim(),
      description: body.description?.trim() || null,
      date: meetingDate,
      endDate,
      location: body.location?.trim() || null,
      meetingLink,
      type: body.type,
      status: 'programada',
      agenda: body.agenda?.trim() || null,
      createdById: session.user.id,
      tenantId: session.tenantId,
    })
    .returning()

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 500, message: 'Error al crear la reunion' })
  }

  const data: Meeting = mapMeeting(row)

  // Send push notification
  const creatorName = session.user.name || 'Administrador'
  await sendPushToAll(session.tenantId, {
    title: 'Nueva reunión programada',
    body: `${creatorName} programó: ${body.title.trim()}`,
    url: '/mi-chana/reuniones',
  }, 'anuncio').catch(() => {})

  return { data }
})
