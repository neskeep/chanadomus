import { db } from '~~/server/db'
import { panicEvents } from '~~/server/db/schema/panic'
import { sendPushToRole } from '~~/server/utils/web-push'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const unitId = (session.user as Record<string, unknown>).unitId as string | undefined

  // 1. Registrar evento de panico
  const [panicEvent] = await db.insert(panicEvents)
    .values({
      userId: session.user.id,
      unitId: unitId ?? null,
      tenantId: session.tenantId,
    })
    .returning({ id: panicEvents.id, createdAt: panicEvents.createdAt })

  // 2. Push a todos los de rol vigilancia
  const userName = session.user.name || session.user.email
  const pushResult = await sendPushToRole(session.tenantId, 'vigilancia', {
    title: 'ALERTA DE PANICO',
    body: `${userName} ha activado el boton de panico`,
    url: '/vigilancia/accesos',
    category: 'panico',
  })

  return {
    data: {
      id: panicEvent!.id,
      createdAt: panicEvent!.createdAt.toISOString(),
      pushSent: pushResult.sent,
    },
  }
})
