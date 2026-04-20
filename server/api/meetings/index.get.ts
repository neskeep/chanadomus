import { db } from '~~/server/db'
import { meetings } from '~~/server/db/schema/meeting'
import { user } from '~~/server/db/schema/auth'
import { eq, and, count, gte, lte, asc } from 'drizzle-orm'
import type { Meeting, MeetingType, MeetingStatus } from '~~/shared/types/meeting'

const VALID_TYPES: MeetingType[] = ['ordinaria', 'extraordinaria', 'comite', 'informativa']
const VALID_STATUSES: MeetingStatus[] = ['programada', 'en_curso', 'completada', 'cancelada']

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
    createdById: row.createdById as string,
    createdByName: createdByName ?? undefined,
    tenantId: row.tenantId as string,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const query = getQuery(event)
  const type = query.type as string | undefined
  const status = query.status as string | undefined
  const from = query.from as string | undefined
  const to = query.to as string | undefined
  const page = Math.max(1, parseInt(query.page as string, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20))
  const offset = (page - 1) * limit

  // Validate filters
  if (type && !VALID_TYPES.includes(type as MeetingType)) {
    throw createError({ statusCode: 400, message: 'Tipo de reunion invalido' })
  }
  if (status && !VALID_STATUSES.includes(status as MeetingStatus)) {
    throw createError({ statusCode: 400, message: 'Estado de reunion invalido' })
  }

  // Build conditions
  const conditions = [eq(meetings.tenantId, session.tenantId)]

  if (type) {
    conditions.push(eq(meetings.type, type as MeetingType))
  }
  if (status) {
    conditions.push(eq(meetings.status, status as MeetingStatus))
  }

  // Default: only future meetings unless explicit from/status param
  if (from) {
    conditions.push(gte(meetings.date, new Date(from)))
  } else if (!status) {
    conditions.push(gte(meetings.date, new Date()))
  }

  if (to) {
    conditions.push(lte(meetings.date, new Date(to)))
  }

  const whereClause = and(...conditions)

  // Get total count
  const [totalRow] = await db
    .select({ total: count() })
    .from(meetings)
    .where(whereClause)

  const total = totalRow?.total ?? 0

  // Get paginated results with creator name
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
      createdById: meetings.createdById,
      tenantId: meetings.tenantId,
      createdAt: meetings.createdAt,
      updatedAt: meetings.updatedAt,
      createdByName: user.name,
    })
    .from(meetings)
    .leftJoin(user, eq(meetings.createdById, user.id))
    .where(whereClause)
    .orderBy(asc(meetings.date))
    .limit(limit)
    .offset(offset)

  const data: Meeting[] = rows.map((row) => mapMeeting(row, row.createdByName))

  return { data, meta: { total, page, limit } }
})
