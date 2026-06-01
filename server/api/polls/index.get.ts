import { db } from '~~/server/db'
import { polls, pollOptions, pollVotes } from '~~/server/db/schema/poll'
import { user } from '~~/server/db/schema/auth'
import { units } from '~~/server/db/schema/unit'
import { eq, and, asc, desc, count, sql, inArray } from 'drizzle-orm'
import type { Poll, PollOption, PollStatus, PollVote } from '~~/shared/types/poll'

const VALID_STATUSES: PollStatus[] = ['draft', 'active', 'closed']

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const query = getQuery(event)
  const status = query.status as string | undefined
  const page = Math.max(1, parseInt(query.page as string, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20))
  const offset = (page - 1) * limit

  // Validate status filter
  if (status && !VALID_STATUSES.includes(status as PollStatus)) {
    throw createError({ statusCode: 400, message: 'Estado invalido' })
  }

  const userRole = session.user.role ?? ''
  const isPrivileged = userRole === 'admin' || userRole === 'conserje'

  // Build conditions
  const conditions = [eq(polls.tenantId, session.tenantId)]

  if (status && isPrivileged) {
    conditions.push(eq(polls.status, status as PollStatus))
  } else if (!isPrivileged) {
    // Non-privileged users only see active and closed
    if (status && (status === 'active' || status === 'closed')) {
      conditions.push(eq(polls.status, status as PollStatus))
    } else {
      conditions.push(
        sql`${polls.status} IN ('active', 'closed')`,
      )
    }
  }

  const whereClause = and(...conditions)

  // Get total count
  const [totalRow] = await db
    .select({ total: count() })
    .from(polls)
    .where(whereClause)

  const total = totalRow?.total ?? 0

  // Get paginated polls with author name
  const rows = await db
    .select({
      id: polls.id,
      title: polls.title,
      description: polls.description,
      type: polls.type,
      status: polls.status,
      createdById: polls.createdById,
      tenantId: polls.tenantId,
      deadline: polls.deadline,
      publishedAt: polls.publishedAt,
      closedAt: polls.closedAt,
      createdAt: polls.createdAt,
      updatedAt: polls.updatedAt,
      displayOrder: polls.displayOrder,
      createdByName: user.name,
    })
    .from(polls)
    .leftJoin(user, eq(polls.createdById, user.id))
    .where(whereClause)
    .orderBy(asc(polls.displayOrder), desc(polls.createdAt))
    .limit(limit)
    .offset(offset)

  if (rows.length === 0) {
    return { data: [], meta: { total, page, limit } }
  }

  const pollIds = rows.map(r => r.id)

  // Get all options for these polls
  const allOptions = await db
    .select()
    .from(pollOptions)
    .where(inArray(pollOptions.pollId, pollIds))

  // Get vote counts per option
  const voteCounts = await db
    .select({
      optionId: pollVotes.optionId,
      voteCount: count(),
    })
    .from(pollVotes)
    .where(inArray(pollVotes.pollId, pollIds))
    .groupBy(pollVotes.optionId)

  const voteCountMap = new Map<string, number>()
  for (const vc of voteCounts) {
    voteCountMap.set(vc.optionId, vc.voteCount)
  }

  // Get total votes per poll
  const totalVotesPerPoll = await db
    .select({
      pollId: pollVotes.pollId,
      totalVotes: count(),
    })
    .from(pollVotes)
    .where(inArray(pollVotes.pollId, pollIds))
    .groupBy(pollVotes.pollId)

  const totalVotesMap = new Map<string, number>()
  for (const tv of totalVotesPerPoll) {
    totalVotesMap.set(tv.pollId, tv.totalVotes)
  }

  // Get total units for tenant
  const [unitsRow] = await db
    .select({ total: count() })
    .from(units)
    .where(eq(units.tenantId, session.tenantId))

  const totalUnits = unitsRow?.total ?? 0

  // Get user vote if user has a unitId
  const userUnitId = (session.user as Record<string, unknown>).unitId as string | undefined
  const userVotesMap = new Map<string, PollVote>()

  if (userUnitId) {
    const userVotes = await db
      .select()
      .from(pollVotes)
      .where(and(
        inArray(pollVotes.pollId, pollIds),
        eq(pollVotes.unitId, userUnitId),
      ))

    for (const uv of userVotes) {
      userVotesMap.set(uv.pollId, {
        id: uv.id,
        pollId: uv.pollId,
        optionId: uv.optionId,
        unitId: uv.unitId,
        votedById: uv.votedById,
        tenantId: uv.tenantId,
        createdAt: uv.createdAt.toISOString(),
      })
    }
  }

  // Assemble response
  const data: Poll[] = rows.map((row) => {
    const pollTotalVotes = totalVotesMap.get(row.id) ?? 0

    const options: PollOption[] = allOptions
      .filter(o => o.pollId === row.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((o) => {
        const vc = voteCountMap.get(o.id) ?? 0
        return {
          id: o.id,
          pollId: o.pollId,
          text: o.text,
          sortOrder: o.sortOrder,
          tenantId: o.tenantId,
          createdAt: o.createdAt.toISOString(),
          voteCount: vc,
          percentage: pollTotalVotes > 0 ? Math.round((vc / pollTotalVotes) * 100) : 0,
        }
      })

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      createdById: row.createdById,
      createdByName: row.createdByName ?? undefined,
      tenantId: row.tenantId,
      deadline: row.deadline?.toISOString() ?? null,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      closedAt: row.closedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      displayOrder: row.displayOrder,
      options,
      totalVotes: pollTotalVotes,
      totalUnits,
      userVote: userVotesMap.get(row.id) ?? null,
    }
  })

  return { data, meta: { total, page, limit } }
})
