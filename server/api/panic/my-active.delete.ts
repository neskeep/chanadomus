import { eq, and, isNull } from 'drizzle-orm'
import { db } from '~~/server/db'
import { panicEvents } from '~~/server/db/schema/panic'
import { broadcastPanicDismiss } from '~~/server/utils/ws-panic'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const [resolved] = await db.update(panicEvents)
    .set({
      resolvedAt: new Date(),
      resolvedBy: session.user.id,
      resolvedNote: 'Desactivada por el usuario',
    })
    .where(
      and(
        eq(panicEvents.userId, session.user.id),
        eq(panicEvents.tenantId, session.tenantId),
        isNull(panicEvents.resolvedAt),
      ),
    )
    .returning({ id: panicEvents.id })

  if (!resolved) {
    throw createError({ statusCode: 404, message: 'No hay alerta activa' })
  }

  broadcastPanicDismiss(resolved.id)

  return { data: { id: resolved.id } }
})
