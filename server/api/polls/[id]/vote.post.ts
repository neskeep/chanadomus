import { db } from '~~/server/db'
import { polls, pollOptions, pollVotes } from '~~/server/db/schema/poll'
import { user } from '~~/server/db/schema/auth'
import { eq, and } from 'drizzle-orm'
import type { PollVote } from '~~/shared/types/poll'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['propietario'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de votacion requerido' })
  }

  const body = await readBody(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Datos invalidos' })
  }

  // Validate optionId
  const optionId = body.optionId as string | undefined
  if (!optionId || typeof optionId !== 'string') {
    throw createError({ statusCode: 400, message: 'Se requiere seleccionar una opcion (optionId)' })
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

  // Only active polls accept votes
  if (poll.status !== 'active') {
    throw createError({ statusCode: 400, message: 'Esta votacion no esta activa' })
  }

  // Check deadline
  if (poll.deadline && new Date() > poll.deadline) {
    throw createError({ statusCode: 400, message: 'El plazo para votar ha vencido' })
  }

  // MVP: only support single type
  if (poll.type !== 'single') {
    throw createError({ statusCode: 400, message: 'Solo votaciones tipo "single" son soportadas en esta version' })
  }

  // Get user's unitId
  const [userData] = await db
    .select({ unitId: user.unitId })
    .from(user)
    .where(eq(user.id, session.user.id))

  const unitId = userData?.unitId
  if (!unitId) {
    throw createError({ statusCode: 400, message: 'Su usuario no tiene una unidad asignada. Contacte al administrador.' })
  }

  // Verify option belongs to this poll
  const [option] = await db
    .select()
    .from(pollOptions)
    .where(and(
      eq(pollOptions.id, optionId),
      eq(pollOptions.pollId, id),
    ))

  if (!option) {
    throw createError({ statusCode: 400, message: 'Opcion invalida para esta votacion' })
  }

  // Check if unit already voted (give descriptive error before hitting unique constraint)
  const [existingVote] = await db
    .select()
    .from(pollVotes)
    .where(and(
      eq(pollVotes.pollId, id),
      eq(pollVotes.unitId, unitId),
    ))

  if (existingVote) {
    throw createError({ statusCode: 409, message: 'Su unidad ya emitio un voto en esta votacion' })
  }

  // Insert vote
  const [newVote] = await db
    .insert(pollVotes)
    .values({
      pollId: id,
      optionId,
      unitId,
      votedById: session.user.id,
      tenantId: session.tenantId,
    })
    .returning()

  if (!newVote) {
    throw createError({ statusCode: 500, message: 'Error al registrar el voto' })
  }

  const data: PollVote = {
    id: newVote.id,
    pollId: newVote.pollId,
    optionId: newVote.optionId,
    unitId: newVote.unitId,
    votedById: newVote.votedById,
    tenantId: newVote.tenantId,
    createdAt: newVote.createdAt.toISOString(),
  }

  return { data }
})
