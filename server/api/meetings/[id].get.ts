import { db } from '~~/server/db'
import { meetings } from '~~/server/db/schema/meeting'
import { user } from '~~/server/db/schema/auth'
import { eq, and } from 'drizzle-orm'
import type { Meeting, MeetingType, MeetingStatus, AgendaItem, MeetingAttendee } from '~~/shared/types/meeting'

function mapMeeting(row: Record<string, unknown>, createdByName?: string | null): Meeting {
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
    createdByName: createdByName ?? undefined,
    tenantId: row.tenantId as string,
    displayOrder: row.displayOrder as number,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de la reunion es requerido' })
  }

  // Get meeting with creator name
  const rows = await db
    .select({
      id: meetings.id,
      title: meetings.title,
      description: meetings.description,
      date: meetings.date,
      endDate: meetings.endDate,
      location: meetings.location,
      meetingLink: meetings.meetingLink,
      type: meetings.type,
      status: meetings.status,
      agenda: meetings.agenda,
      minutes: meetings.minutes,
      minutesAttendees: meetings.minutesAttendees,
      minutesQuorum: meetings.minutesQuorum,
      minutesPoints: meetings.minutesPoints,
      minutesAgreements: meetings.minutesAgreements,
      minutesNotes: meetings.minutesNotes,
      agendaItems: meetings.agendaItems,
      minutesAttendeesData: meetings.minutesAttendeesData,
      minutesAgreementsList: meetings.minutesAgreementsList,
      createdById: meetings.createdById,
      tenantId: meetings.tenantId,
      createdAt: meetings.createdAt,
      updatedAt: meetings.updatedAt,
      displayOrder: meetings.displayOrder,
      createdByName: user.name,
    })
    .from(meetings)
    .leftJoin(user, eq(meetings.createdById, user.id))
    .where(and(eq(meetings.id, id), eq(meetings.tenantId, session.tenantId)))

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 404, message: 'Reunion no encontrada' })
  }

  const data: Meeting = mapMeeting(row, row.createdByName)

  return { data }
})
