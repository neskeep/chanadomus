import { db } from '~~/server/db'
import { polls, pollOptions, pollVotes } from '~~/server/db/schema/poll'
import { user } from '~~/server/db/schema/auth'
import { units } from '~~/server/db/schema/unit'
import { eq, and, count } from 'drizzle-orm'
import { sendPushToAll } from '~~/server/utils/web-push'
import type { Poll, PollOption, PollStatus, PollType } from '~~/shared/types/poll'

const VALID_STATUSES: PollStatus[] = ['draft', 'active', 'closed']
const VALID_TYPES: PollType[] = ['single', 'multiple']

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de votacion requerido' })
  }

  const body = await readBody(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Datos invalidos' })
  }

  // Get current poll
  const [current] = await db
    .select()
    .from(polls)
    .where(and(
      eq(polls.id, id),
      eq(polls.tenantId, session.tenantId),
    ))

  if (!current) {
    throw createError({ statusCode: 404, message: 'Votacion no encontrada' })
  }

  // Cannot edit closed polls
  if (current.status === 'closed') {
    throw createError({ statusCode: 400, message: 'No se puede editar una votacion cerrada' })
  }

  // Build update values
  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      throw createError({ statusCode: 400, message: 'El titulo es requerido' })
    }
    if (body.title.length > 200) {
      throw createError({ statusCode: 400, message: 'El titulo no puede exceder 200 caracteres' })
    }
    updateValues.title = body.title.trim()
  }

  if (body.description !== undefined) {
    updateValues.description = typeof body.description === 'string' ? body.description.trim() || null : null
  }

  if (body.type !== undefined) {
    if (!VALID_TYPES.includes(body.type as PollType)) {
      throw createError({ statusCode: 400, message: 'Tipo de votacion invalido' })
    }
    updateValues.type = body.type
  }

  if (body.deadline !== undefined) {
    if (body.deadline === null) {
      updateValues.deadline = null
    } else {
      const deadlineDate = new Date(body.deadline as string)
      if (isNaN(deadlineDate.getTime())) {
        throw createError({ statusCode: 400, message: 'Fecha limite invalida' })
      }
      updateValues.deadline = deadlineDate
    }
  }

  // Handle status change
  let pushType: 'published' | 'closed' | null = null

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as PollStatus)) {
      throw createError({ statusCode: 400, message: 'Estado invalido' })
    }

    const newStatus = body.status as PollStatus
    updateValues.status = newStatus

    // Transitioning to active for the first time
    if (newStatus === 'active' && current.status !== 'active') {
      if (!current.publishedAt) {
        updateValues.publishedAt = new Date()
      }
      pushType = 'published'
    }

    // Transitioning to closed (current.status is 'draft' or 'active' at this point)
    if (newStatus === 'closed') {
      updateValues.closedAt = new Date()
      pushType = 'closed'
    }
  }

  const updatedRows = await db
    .update(polls)
    .set(updateValues)
    .where(eq(polls.id, id))
    .returning()

  const updated = updatedRows[0]
  if (!updated) {
    throw createError({ statusCode: 500, message: 'Error al actualizar la votacion' })
  }

  // Send push notifications
  if (pushType === 'published') {
    sendPushToAll(session.tenantId, {
      title: 'Nueva votacion',
      body: updated.title,
      url: '/mi-chana/votaciones',
      category: 'poll',
    }).catch(() => {})
  } else if (pushType === 'closed') {
    sendPushToAll(session.tenantId, {
      title: 'Votacion cerrada',
      body: `Se cerraron los resultados de: ${updated.title}`,
      url: '/mi-chana/votaciones',
      category: 'poll',
    }).catch(() => {})
  }

  // Get author name
  const [author] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, updated.createdById))

  // Get options with vote counts
  const options = await db
    .select()
    .from(pollOptions)
    .where(eq(pollOptions.pollId, id))

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

  const [totalVotesRow] = await db
    .select({ total: count() })
    .from(pollVotes)
    .where(eq(pollVotes.pollId, id))

  const totalVotes = totalVotesRow?.total ?? 0

  const [unitsRow] = await db
    .select({ total: count() })
    .from(units)
    .where(eq(units.tenantId, session.tenantId))

  const totalUnits = unitsRow?.total ?? 0

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

  const data: Poll = {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    type: updated.type,
    status: updated.status,
    createdById: updated.createdById,
    createdByName: author?.name ?? undefined,
    tenantId: updated.tenantId,
    deadline: updated.deadline?.toISOString() ?? null,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
    closedAt: updated.closedAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    options: pollOptionsList,
    totalVotes,
    totalUnits,
  }

  return { data }
})
