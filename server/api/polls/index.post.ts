import { z } from 'zod'
import { db } from '~~/server/db'
import { polls, pollOptions } from '~~/server/db/schema/poll'
import { sendPushToAll } from '~~/server/utils/web-push'
import type { Poll, PollOption, PollStatus, PollType } from '~~/shared/types/poll'

const createPollSchema = z.object({
  title: z.string().min(1, 'El titulo es requerido').max(200, 'El titulo no puede exceder 200 caracteres'),
  description: z.string().optional().nullable(),
  type: z.enum(['single', 'multiple']).default('single'),
  status: z.enum(['draft', 'active']).default('draft'),
  deadline: z.string().refine((v) => !isNaN(new Date(v).getTime()), 'Fecha limite invalida').optional().nullable(),
  options: z.array(z.string().min(1, 'Cada opcion debe ser un texto no vacio').max(500, 'Cada opcion no puede exceder 500 caracteres'))
    .min(2, 'Se requieren al menos 2 opciones')
    .max(20, 'Maximo 20 opciones permitidas'),
  displayOrder: z.number().int().min(0).default(0),
})

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const body = await validateBody(event, createPollSchema)

  const title = body.title.trim()
  const description = body.description?.trim() || null
  const type: PollType = body.type
  const status: PollStatus = body.status

  let deadline: Date | null = null
  if (body.deadline) {
    deadline = new Date(body.deadline)
  }

  const optionTexts = body.options.map((opt) => opt.trim())

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
        displayOrder: body.displayOrder,
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
    displayOrder: result.poll.displayOrder,
    options,
    totalVotes: 0,
    totalUnits: 0,
  }

  return { data }
})
