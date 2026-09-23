import { db } from '~~/server/db'
import { events } from '~~/server/db/schema/event'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { localDateOf, localToday } from './tenant-time'

/**
 * Aviso a vigilancia "el dia del evento".
 *
 * Detecta eventos activos cuya fecha de inicio es HOY (en la zona del condominio) y
 * que aun no han sido avisados a vigilancia, los marca como notificados y envia
 * un push por cada uno. Debe llamarse ANTES de leer/listar los eventos activos.
 *
 * Idempotente y seguro ante concurrencia: el UPDATE ... WHERE notified_vigilance_at
 * IS NULL ... RETURNING "reclama" atomicamente solo los eventos aun no avisados,
 * de modo que dos llamadas simultaneas (p.ej. polling) no dupliquen el push.
 *
 * Acotado por tenant. La comparacion de fecha se hace en SQL con la zona de
 * runtimeConfig.public.appTimezone (starts_at se almacena como UTC naive), via
 * los helpers de tenant-time para no desfasar el dia.
 */
export async function notifyVigilanceTodayEvents(tenantId: string): Promise<void> {
  const claimed = await db
    .update(events)
    .set({ notifiedVigilanceAt: new Date() })
    .where(and(
      eq(events.tenantId, tenantId),
      eq(events.status, 'activo'),
      isNull(events.notifiedVigilanceAt),
      sql`${localDateOf(events.startsAt)} = ${localToday()}`,
    ))
    .returning({ id: events.id, title: events.title })

  if (claimed.length === 0) return

  for (const ev of claimed) {
    await sendPushToRole(tenantId, 'vigilancia', {
      title: 'Evento hoy',
      body: `Hoy hay un evento programado: ${ev.title}`,
      url: '/vigilancia/eventos',
    }, 'anuncio')
  }
}
