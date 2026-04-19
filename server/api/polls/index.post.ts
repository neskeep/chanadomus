import { db } from '~~/server/db'
import { polls, pollOptions } from '~~/server/db/schema/poll'
import { sendPushToAll } from '~~/server/utils/web-push'
import type { Poll, PollOption, PollStatus, PollType } from '~~/shared/types/poll'

const VALID_STATUSES: PollStatus[] = ['draft', 'active']
const VALID_TYPES: PollType[] = ['single', 'multiple']

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const body = await readBody(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Datos invalidos' })
  }

  // Validate title
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) {
    throw createError({ statusCode: 400, message: 'El titulo es requerido' })
  }
  if (title.length > 200) {
    throw createError({ statusCode: 400, message: 'El titulo no puede exceder 200 caracteres' })
  }

  // Validate description
  const description = typeof body.description === 'string' ? body.description.trim() || null : null

  // Validate type
  const type: PollType = VALID_TYPES.includes(body.type as PollType) ? (body.type as PollType) : 'single'

  // Validate status
  const status: PollStatus = VALID_STATUSES.includes(body.status as PollStatus) ? (body.status as PollStatus) : 'draft'

  // Validate deadline
  let deadline: Date | null = null
  if (body.deadline) {
    deadline = new Date(body.deadline as string)
    if (isNaN(deadline.getTime())) {
      throw createError({ statusCode: 400, message: 'Fecha limite invalida' })
    }
  }

  // Validate options
  if (!Array.isArray(body.options) || body.options.length < 2) {
    throw createError({ statusCode: 400, message: 'Se requieren al menos 2 opciones' })
  }

  const optionTexts: string[] = []
  for (const opt of body.options) {
    if (typeof opt !== 'string' || !opt.trim()) {
      throw createError({ statusCode: 400, message: 'Cada opcion debe ser un texto no vacio' })
    }
    if (opt.trim().length > 500) {
      throw createError({ statusCode: 400, message: 'Cada opcion no puede exceder 500 caracteres' })
    }
    optionTexts.push(opt.trim())
  }

  if (optionTexts.length > 20) {
    throw createError({ statusCode: 400, message: 'Maximo 20 opciones permitidas' })
  }

  // Determine publishedAt
  const now = new Date()
  const publishedAt = status === 'active' ? now : null

  // Insert poll + options in transaction
  const result = await db.transaction(async (tx) => {
    const [newPoll] = await tx
      .insert(polls)
      .values({
        title,
        description,
        type,
        status,
        createdById: session.user.id,
        tenantId: session.tenantId,
        deadline,
        publishedAt,
      })
      .returning()

    if (!newPoll) {
      throw createError({ statusCode: 500, message: 'Error al crear la votacion' })
    }

    const optionValues = optionTexts.map((text, index) => ({
      pollId: newPoll.id,
      text,
      sortOrder: index,
      tenantId: session.tenantId,
    }))

    const insertedOptions = await tx
      .insert(pollOptions)
      .values(optionValues)
      .returning()

    return { poll: newPoll, options: insertedOptions }
  })

  // Send push notification if published
  if (status === 'active') {
    sendPushToAll(session.tenantId, {
      title: 'Nueva votacion',
      body: title,
      url: '/mi-chana/votaciones',
      category: 'poll',
    }).catch(() => {
      // Push failure should not block the response
    })
  }

  const options: PollOption[] = result.options.map((o) => ({
    id: o.id,
    pollId: o.pollId,
    text: o.text,
    sortOrder: o.sortOrder,
    tenantId: o.tenantId,
    createdAt: o.createdAt.toISOString(),
    voteCount: 0,
    percentage: 0,
  }))

  const data: Poll = {
    id: result.poll.id,
    title: result.poll.title,
    description: result.poll.description,
    type: result.poll.type,
    status: result.poll.status,
    createdById: result.poll.createdById,
    createdByName: session.user.name ?? undefined,
    tenantId: result.poll.tenantId,
    deadline: result.poll.deadline?.toISOString() ?? null,
    publishedAt: result.poll.publishedAt?.toISOString() ?? null,
    closedAt: result.poll.closedAt?.toISOString() ?? null,
    createdAt: result.poll.createdAt.toISOString(),
    updatedAt: result.poll.updatedAt.toISOString(),
    options,
    totalVotes: 0,
    totalUnits: 0,
  }

  return { data }
})
