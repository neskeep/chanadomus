import { db } from '~~/server/db'
import { polls, pollOptions, pollVotes } from '~~/server/db/schema/poll'
import { units } from '~~/server/db/schema/unit'
import { eq, and, count } from 'drizzle-orm'
import type { PollOption } from '~~/shared/types/poll'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de votacion requerido' })
  }

  // Get the poll
  const [poll] = await db
    .select()
    .from(polls)
    .where(and(
      eq(polls.id, id),
      eq(polls.tenantId, session.tenantId),
    ))

  if (!poll) {
    throw createError({ statusCode: 404, message: 'Votacion no encontrada' })
  }

  // Non-privileged cannot see draft poll results
  const userRole = session.user.role ?? ''
  const isPrivileged = userRole === 'admin' || userRole === 'conserje'

  if (!isPrivileged && poll.status === 'draft') {
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

  // Get total votes
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

  // Build options with vote counts and percentages
  const pollOptionsList: PollOption[] = options
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

  const participation = totalUnits > 0 ? Math.round((totalVotes / totalUnits) * 100) : 0

  return {
    data: {
      pollId: poll.id,
      title: poll.title,
      status: poll.status,
      type: poll.type,
      options: pollOptionsList,
      totalVotes,
      totalUnits,
      participation,
    },
  }
})
