import { db } from '~~/server/db'
import { meetings } from '~~/server/db/schema/meeting'
import { eq, and } from 'drizzle-orm'
import type { Meeting, MeetingType, MeetingStatus, UpdateMeeting, AgendaItem, MeetingAttendee } from '~~/shared/types/meeting'

const VALID_TYPES: MeetingType[] = ['ordinaria', 'extraordinaria', 'comite', 'informativa']
const VALID_STATUSES: MeetingStatus[] = ['programada', 'en_curso', 'completada', 'cancelada']

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
    status: row.status as MeetingStatus,
    agenda: row.agenda as string | null,
    minutes: row.minutes as string | null,
    minutesAttendees: row.minutesAttendees as string | null,
    minutesQuorum: row.minutesQuorum as boolean | null,
    minutesPoints: row.minutesPoints as string | null,
    minutesAgreements: row.minutesAgreements as string | null,
    minutesNotes: row.minutesNotes as string | null,
    agendaItems: (row.agendaItems as AgendaItem[] | null) ?? null,
    minutesAttendeesData: (row.minutesAttendeesData as MeetingAttendee[] | null) ?? null,
    minutesAgreementsList: (row.minutesAgreementsList as string[] | null) ?? null,
    createdById: row.createdById as string,
    tenantId: row.tenantId as string,
    displayOrder: row.displayOrder as number,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de la reunion es requerido' })
  }

  const body = await readBody<UpdateMeeting>(event)

  // Validate fields if provided
  if (body.title !== undefined) {
    if (!body.title || !body.title.trim()) {
      throw createError({ statusCode: 400, message: 'El titulo no puede estar vacio' })
    }
    if (body.title.trim().length > 200) {
      throw createError({ statusCode: 400, message: 'El titulo no puede exceder 200 caracteres' })
    }
  }
  if (body.date !== undefined) {
    const meetingDate = new Date(body.date)
    if (isNaN(meetingDate.getTime())) {
      throw createError({ statusCode: 400, message: 'Fecha invalida' })
    }
    if (meetingDate <= new Date()) {
      throw createError({ statusCode: 400, message: 'La fecha debe ser futura' })
    }
  }
  if (body.type !== undefined && !VALID_TYPES.includes(body.type)) {
    throw createError({ statusCode: 400, message: 'Tipo de reunion invalido' })
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    throw createError({ statusCode: 400, message: 'Estado de reunion invalido' })
  }

  // Check meeting exists and belongs to tenant
  const [existing] = await db
    .select({ id: meetings.id })
    .from(meetings)
    .where(and(eq(meetings.id, id), eq(meetings.tenantId, session.tenantId)))

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Reunion no encontrada' })
  }

  // Build update values
  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  }
  if (body.displayOrder !== undefined) {
    const order = Number(body.displayOrder)
    if (!Number.isInteger(order) || order < 0) {
      throw createError({ statusCode: 400, message: 'displayOrder debe ser un entero >= 0' })
    }
    updateValues.displayOrder = order
  }
  if (body.title !== undefined) updateValues.title = body.title.trim()
  if (body.description !== undefined) updateValues.description = body.description?.trim() || null
  if (body.date !== undefined) updateValues.date = new Date(body.date)
  if (body.endDate !== undefined) updateValues.endDate = body.endDate ? new Date(body.endDate) : null
  if (body.location !== undefined) updateValues.location = body.location?.trim() || null
  if (body.meetingLink !== undefined) updateValues.meetingLink = body.meetingLink?.trim() || null
  if (body.type !== undefined) updateValues.type = body.type
  if (body.status !== undefined) updateValues.status = body.status
  if (body.agenda !== undefined) updateValues.agenda = body.agenda?.trim() || null
  if (body.minutes !== undefined) updateValues.minutes = body.minutes?.trim() || null
  if (body.minutesAttendees !== undefined) updateValues.minutesAttendees = body.minutesAttendees?.trim() || null
  if (body.minutesQuorum !== undefined) updateValues.minutesQuorum = body.minutesQuorum ?? null
  if (body.minutesPoints !== undefined) updateValues.minutesPoints = body.minutesPoints?.trim() || null
  if (body.minutesAgreements !== undefined) updateValues.minutesAgreements = body.minutesAgreements?.trim() || null
  if (body.minutesNotes !== undefined) updateValues.minutesNotes = body.minutesNotes?.trim() || null
  if (body.agendaItems !== undefined) updateValues.agendaItems = body.agendaItems ?? null
  if (body.minutesAttendeesData !== undefined) updateValues.minutesAttendeesData = body.minutesAttendeesData ?? null
  if (body.minutesAgreementsList !== undefined) updateValues.minutesAgreementsList = body.minutesAgreementsList ?? null

  const rows = await db
    .update(meetings)
    .set(updateValues)
    .where(and(eq(meetings.id, id), eq(meetings.tenantId, session.tenantId)))
    .returning()

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 500, message: 'Error al actualizar la reunion' })
  }

  const data: Meeting = mapMeeting(row)

  return { data }
})
