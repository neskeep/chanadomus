import { db } from '~~/server/db'
import { polls, pollOptions, pollVotes } from '~~/server/db/schema/poll'
import { user } from '~~/server/db/schema/auth'
import { units } from '~~/server/db/schema/unit'
import { eq, and, count } from 'drizzle-orm'
import type { Poll, PollOption, PollVote } from '~~/shared/types/poll'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  // Lazy expiration: cerrar polls vencidos antes de leer para consistencia
  await expirePolls(session.tenantId)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de votacion requerido' })
  }

  const userRole = session.user.role ?? ''
  const isPrivileged = userRole === 'admin' || userRole === 'conserje'

  // Get poll with author name
  const [row] = await db
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
    .where(and(
      eq(polls.id, id),
      eq(polls.tenantId, session.tenantId),
    ))

  if (!row) {
    throw createError({ statusCode: 404, message: 'Votacion no encontrada' })
  }

  // Non-privileged users cannot see draft polls
  if (!isPrivileged && row.status === 'draft') {
    throw createError({ statusCode: 404, message: 'Votacion no encontrada' })
  }

  // Get options
  const options = await db
    .select()
    .from(pollOptions)
    .where(eq(pollOptions.pollId, id))

  // Get vote counts per option
  const voteCounts = await db
    .select({
      optionId: pollVotes.optionId,
      voteCount: count(),
    })
    .from(pollVotes)
    .where(eq(pollVotes.pollId, id))
    .groupBy(pollVotes.optionId)

  const voteCountMap = new Map<string, number>()
  for (const vc of voteCounts) {
    voteCountMap.set(vc.optionId, vc.voteCount)
  }

  // Get total votes for this poll
  const [totalVotesRow] = await db
    .select({ total: count() })
    .from(pollVotes)
    .where(eq(pollVotes.pollId, id))

  const totalVotes = totalVotesRow?.total ?? 0

  // Get total units for tenant
  const [unitsRow] = await db
    .select({ total: count() })
    .from(units)
    .where(eq(units.tenantId, session.tenantId))

  const totalUnits = unitsRow?.total ?? 0

  // Get user vote if user has a unitId
  const userUnitId = (session.user as Record<string, unknown>).unitId as string | undefined
  let userVote: PollVote | null = null

  if (userUnitId) {
    const [vote] = await db
      .select()
      .from(pollVotes)
      .where(and(
        eq(pollVotes.pollId, id),
        eq(pollVotes.unitId, userUnitId),
      ))

    if (vote) {
      userVote = {
        id: vote.id,
        pollId: vote.pollId,
        optionId: vote.optionId,
        unitId: vote.unitId,
        votedById: vote.votedById,
        tenantId: vote.tenantId,
        createdAt: vote.createdAt.toISOString(),
      }
    }
  }

  // Build options with vote counts and percentages
  const pollOptions_: PollOption[] = options
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
        percentage: totalVotes > 0 ? Math.round((vc / totalVotes) * 100) : 0,
      }
    })

  const data: Poll = {
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
    options: pollOptions_,
    totalVotes,
    totalUnits,
    userVote,
  }

  return { data }
})
