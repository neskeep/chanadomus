import { db } from '~~/server/db'
import { incidents } from '~~/server/db/schema/incident'
import { polls } from '~~/server/db/schema/poll'
import { meetings } from '~~/server/db/schema/meeting'
import { announcements } from '~~/server/db/schema/announcement'
import { providers } from '~~/server/db/schema/provider'
import { units } from '~~/server/db/schema/unit'
import { financialRecords } from '~~/server/db/schema/financial'
import { accessLogs } from '~~/server/db/schema/access'
import { eq, and, count, gte, asc, inArray, sql as dsql } from 'drizzle-orm'

interface DashboardStats {
  openIncidents: number
  inProgressIncidents: number
  activePolls: number
  upcomingMeetings: number
  nextMeeting: { title: string; date: string } | null
  publishedAnnouncements: number
  activeProviders: number
  totalUnits: number
  unitsInDebt: number
  pendingProviders: number
  myOpenIncidents: number
  todayAccessCount: number
}

async function safeCount(fn: () => Promise<number>): Promise<number> {
  try {
    return await fn()
  } catch {
    return 0
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { tenantId } = session
  const userId = session.user.id
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [
    openIncidents,
    inProgressIncidents,
    activePolls,
    upcomingMeetings,
    nextMeetingResult,
    publishedAnnouncements,
    activeProviders,
    totalUnits,
    pendingProviders,
    myOpenIncidents,
    todayAccessCount,
    unitsInDebt,
  ] = await Promise.all([
    // openIncidents
    safeCount(async () => {
      const [row] = await db
        .select({ total: count() })
        .from(incidents)
        .where(and(eq(incidents.tenantId, tenantId), eq(incidents.status, 'open')))
      return row?.total ?? 0
    }),

    // inProgressIncidents
    safeCount(async () => {
      const [row] = await db
        .select({ total: count() })
        .from(incidents)
        .where(and(eq(incidents.tenantId, tenantId), eq(incidents.status, 'in_progress')))
      return row?.total ?? 0
    }),

    // activePolls
    safeCount(async () => {
      const [row] = await db
        .select({ total: count() })
        .from(polls)
        .where(and(eq(polls.tenantId, tenantId), eq(polls.status, 'active')))
      return row?.total ?? 0
    }),

    // upcomingMeetings
    safeCount(async () => {
      const [row] = await db
        .select({ total: count() })
        .from(meetings)
        .where(and(
          eq(meetings.tenantId, tenantId),
          eq(meetings.status, 'programada'),
          gte(meetings.date, now),
        ))
      return row?.total ?? 0
    }),

    // nextMeeting (returns object or null, not number)
    (async (): Promise<{ title: string; date: string } | null> => {
      try {
        const [row] = await db
          .select({ title: meetings.title, date: meetings.date })
          .from(meetings)
          .where(and(
            eq(meetings.tenantId, tenantId),
            eq(meetings.status, 'programada'),
            gte(meetings.date, now),
          ))
          .orderBy(asc(meetings.date))
          .limit(1)
        if (!row) return null
        return { title: row.title, date: row.date.toISOString() }
      } catch {
        return null
      }
    })(),

    // publishedAnnouncements
    safeCount(async () => {
      const [row] = await db
        .select({ total: count() })
        .from(announcements)
        .where(and(eq(announcements.tenantId, tenantId), eq(announcements.status, 'published')))
      return row?.total ?? 0
    }),

    // activeProviders
    safeCount(async () => {
      const [row] = await db
        .select({ total: count() })
        .from(providers)
        .where(and(eq(providers.tenantId, tenantId), eq(providers.status, 'active')))
      return row?.total ?? 0
    }),

    // totalUnits
    safeCount(async () => {
      const [row] = await db
        .select({ total: count() })
        .from(units)
        .where(eq(units.tenantId, tenantId))
      return row?.total ?? 0
    }),

    // pendingProviders
    safeCount(async () => {
      const [row] = await db
        .select({ total: count() })
        .from(providers)
        .where(and(eq(providers.tenantId, tenantId), eq(providers.status, 'pending')))
      return row?.total ?? 0
    }),

    // myOpenIncidents
    safeCount(async () => {
      const [row] = await db
        .select({ total: count() })
        .from(incidents)
        .where(and(
          eq(incidents.tenantId, tenantId),
          eq(incidents.reportedById, userId),
          inArray(incidents.status, ['open', 'in_progress']),
        ))
      return row?.total ?? 0
    }),

    // todayAccessCount
    safeCount(async () => {
      const [row] = await db
        .select({ total: count() })
        .from(accessLogs)
        .where(and(
          eq(accessLogs.tenantId, tenantId),
          gte(accessLogs.createdAt, todayMidnight),
        ))
      return row?.total ?? 0
    }),

    // unitsInDebt: units where sum of cargos > sum of abonos
    safeCount(async () => {
      const result = await db.execute(
        dsql`SELECT COUNT(*) as total FROM (
          SELECT unit_id
          FROM financial_records
          WHERE tenant_id = ${tenantId}
          GROUP BY unit_id
          HAVING SUM(CASE WHEN type = 'cargo' THEN CAST(amount AS numeric) ELSE -CAST(amount AS numeric) END) > 0
        ) AS debt_units`,
      )
      const rows = result as unknown as Array<{ total: string | number }>
      return Number(rows[0]?.total ?? 0)
    }),
  ])

  const data: DashboardStats = {
    openIncidents,
    inProgressIncidents,
    activePolls,
    upcomingMeetings,
    nextMeeting: nextMeetingResult,
    publishedAnnouncements,
    activeProviders,
    totalUnits,
    unitsInDebt,
    pendingProviders,
    myOpenIncidents,
    todayAccessCount,
  }

  return { data }
})
