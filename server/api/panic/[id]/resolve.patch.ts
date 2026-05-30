import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { panicEvents } from '~~/server/db/schema/panic'
import { broadcastPanicDismiss } from '~~/server/utils/ws-panic'

export default defineEventHandler(async (event) => {
  const session = await requireRole(event, ['admin', 'vigilancia'])
  const { tenantId } = await requireTenant(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  const body = await readBody<{ note?: string }>(event)

  const [updated] = await db.update(panicEvents)
    .set({
      resolvedAt: new Date(),
      resolvedBy: session.user.id,
      resolvedNote: body?.note || null,
    })
    .where(and(
      eq(panicEvents.id, id),
      eq(panicEvents.tenantId, tenantId),
    ))
    .returning({ id: panicEvents.id, resolvedAt: panicEvents.resolvedAt })

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Alerta no encontrada' })
  }

  broadcastPanicDismiss(updated.id)

  return { data: { id: updated.id, resolvedAt: updated.resolvedAt?.toISOString() } }
})
