import { db } from '~~/server/db'
import { incidents } from '~~/server/db/schema/incident'
import { polls } from '~~/server/db/schema/poll'
import { meetings } from '~~/server/db/schema/meeting'
import { announcements } from '~~/server/db/schema/announcement'
import { providers } from '~~/server/db/schema/provider'
import { units } from '~~/server/db/schema/unit'
import { accessLogs, qrCodes } from '~~/server/db/schema/access'
import { panicEvents } from '~~/server/db/schema/panic'
import { eq, and, count, gte, asc, inArray, isNull, gt, or, sql as dsql } from 'drizzle-orm'

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
  todayEntryCount: number
  todayExitCount: number
  myBalance: number
  myIsInDebt: boolean
  myActiveVisits: number
  unresolvedPanicCount: number
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
  // Calculate midnight in Venezuela time (UTC-4)
  const veNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Caracas' }))
  veNow.setHours(0, 0, 0, 0)
  // Convert back to UTC: Venezuela is UTC-4, so add 4 hours
  const todayMidnight = new Date(veNow.getTime() + 4 * 60 * 60 * 1000)

  const unitId = (session.user as Record<string, unknown>).unitId as string | undefined

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
    todayEntryCount,
    todayExitCount,
    myBalanceResult,
    myActiveVisits,
    unresolvedPanicCount,
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

    // todayEntryCount — actual entries today (exclude exit-only orphan rows)
    safeCount(async () => {
      const [row] = await db
        .select({ total: count() })
        .from(accessLogs)
        .where(and(
          eq(accessLogs.tenantId, tenantId),
          gte(accessLogs.createdAt, todayMidnight),
          or(
            isNull(accessLogs.exitAt),
            dsql`${accessLogs.exitAt} > ${accessLogs.createdAt} + interval '1 minute'`,
          ),
        ))
      return row?.total ?? 0
    }),

    // todayExitCount — access logs with exitAt today (exits)
    safeCount(async () => {
      const [row] = await db
        .select({ total: count() })
        .from(accessLogs)
        .where(and(
          eq(accessLogs.tenantId, tenantId),
          gte(accessLogs.exitAt, todayMidnight),
        ))
      return row?.total ?? 0
    }),

    // myBalance — sum of cargos minus abonos for current user's unit
    (async (): Promise<number> => {
      try {
        if (!unitId) return 0
        const result = await db.execute(
          dsql`SELECT COALESCE(SUM(CASE WHEN type = 'cargo' THEN CAST(amount AS numeric) ELSE -CAST(amount AS numeric) END), 0) as balance
            FROM financial_records
            WHERE tenant_id = ${tenantId} AND unit_id = ${unitId}`,
        )
        const rows = result as unknown as Array<{ balance: string | number }>
        return Number(rows[0]?.balance ?? 0)
      } catch {
        return 0
      }
    })(),

    // myActiveVisits — QR codes owned by user, not used, not expired
    safeCount(async () => {
      const [row] = await db
        .select({ total: count() })
        .from(qrCodes)
        .where(and(
          eq(qrCodes.ownerId, userId),
          eq(qrCodes.tenantId, tenantId),
          isNull(qrCodes.usedAt),
          gt(qrCodes.expiresAt, now),
        ))
      return row?.total ?? 0
    }),

    // unresolvedPanicCount — panic events without resolution
    safeCount(async () => {
      const [row] = await db
        .select({ total: count() })
        .from(panicEvents)
        .where(and(
          eq(panicEvents.tenantId, tenantId),
          isNull(panicEvents.resolvedAt),
        ))
      return row?.total ?? 0
    }),
  ])

  const myBalance = myBalanceResult
  const myIsInDebt = myBalance > 0

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
    todayEntryCount,
    todayExitCount,
    myBalance,
    myIsInDebt,
    myActiveVisits,
    unresolvedPanicCount,
  }

  return { data }
})
