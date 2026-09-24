import { and, eq, inArray } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events } from '~~/server/db/schema/event'
import { user } from '~~/server/db/schema/auth'
import { sendPushToUsers } from '~~/server/utils/web-push'
import {
  buildAutoCheckoutNotice,
  countClosedGuestsByEvent,
  pickAutoCheckoutRecipients,
} from '~~/shared/lib/event-auto-checkout-notice'
import type { AutoCheckoutRecipientCandidate } from '~~/shared/lib/event-auto-checkout-notice'

/**
 * Categoria de preferencias push: la misma que usan los demas avisos de eventos
 * (aprobacion, evento pendiente, evento hoy). Si el usuario la desactiva, no recibe push.
 */
const EVENT_NOTICE_CATEGORY = 'anuncio' as const

/**
 * Avisa por push al propietario responsable de cada evento cuyos invitados cerro
 * el cierre automatico. Un aviso por evento con el total ("N invitados").
 *
 * Recibe las filas devueltas por el UPDATE de markGuestsExited (ya confirmado): solo
 * notifica quien cerro filas de verdad, asi que es idempotente ante cierres en paralelo.
 *
 * No hay centro de notificaciones in-app (la campana abre las preferencias de push),
 * asi que el unico canal es push.
 *
 * Nunca lanza: un fallo se registra en log y no afecta al cierre ya confirmado.
 */
export async function notifyAutoCheckout(
  tenantId: string,
  closedRows: ReadonlyArray<{ eventId: string }>,
): Promise<void> {
  try {
    const counts = countClosedGuestsByEvent(closedRows)
    if (counts.size === 0) return

    const eventRows = await db
      .select({
        id: events.id,
        title: events.title,
        unitId: events.unitId,
        creatorId: user.id,
        creatorRole: user.role,
        creatorUnitId: user.unitId,
        creatorBanned: user.banned,
      })
      .from(events)
      .leftJoin(user, eq(user.id, events.createdById))
      .where(and(
        eq(events.tenantId, tenantId),
        inArray(events.id, [...counts.keys()]),
      ))

    const unitIds = [...new Set(eventRows.map(e => e.unitId))]
    const owners: AutoCheckoutRecipientCandidate[] = unitIds.length === 0
      ? []
      : await db
          .select({ id: user.id, role: user.role, unitId: user.unitId, banned: user.banned })
          .from(user)
          .where(and(
            eq(user.tenantId, tenantId),
            eq(user.role, 'propietario'),
            inArray(user.unitId, unitIds),
          ))

    for (const ev of eventRows) {
      const recipients = pickAutoCheckoutRecipients({
        unitId: ev.unitId,
        creator: ev.creatorId
          ? { id: ev.creatorId, role: ev.creatorRole, unitId: ev.creatorUnitId, banned: ev.creatorBanned }
          : null,
        unitOwners: owners.filter(o => o.unitId === ev.unitId),
      })
      if (recipients.length === 0) continue

      const notice = buildAutoCheckoutNotice({
        eventId: ev.id,
        eventTitle: ev.title,
        guestCount: counts.get(ev.id) ?? 0,
      })

      try {
        await sendPushToUsers(recipients, { ...notice, category: EVENT_NOTICE_CATEGORY }, EVENT_NOTICE_CATEGORY)
      }
      catch (error) {
        console.error(`[auto-checkout] No se pudo avisar del evento ${ev.id}:`, error)
      }
    }
  }
  catch (error) {
    console.error('[auto-checkout] No se pudo preparar el aviso al propietario:', error)
  }
}
