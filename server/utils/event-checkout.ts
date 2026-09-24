import { and, eq, inArray, isNull, lt } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events, eventGuests } from '~~/server/db/schema/event'
import { accessLogs } from '~~/server/db/schema/access'
import { broadcastAccessMessage } from '~~/server/utils/ws-access'
import { notifyAutoCheckout } from '~~/server/utils/notify-auto-checkout'
import type { DbExecutor } from '~~/server/utils/access-entry-exit'
import { autoCheckoutAt, autoCheckoutCutoff } from '~~/shared/lib/event-window'

export type EventGuestRow = typeof eventGuests.$inferSelect

interface MarkGuestsExitedInput {
  tenantId: string
  guestIds: string[]
  at: Date
  /** Usuario que registra la salida; null = salida automatica del sistema. */
  checkedOutBy: string | null
}

/**
 * Registra la salida de invitados de evento y cierra su access log.
 *
 * - UPDATE condicionado a status='dentro': los que ya salieron (otra peticion o
 *   el cierre automatico) se ignoran, asi que es idempotente y seguro ante carreras.
 * - Solo se toca `access_logs.exit_at` de los invitados que realmente cambiaron, y
 *   solo si seguia vacio (no se pisa una salida ya registrada en la puerta).
 *
 * Debe llamarse dentro de una transaccion. Devuelve las filas actualizadas.
 */
export async function markGuestsExited(tx: DbExecutor, input: MarkGuestsExitedInput): Promise<EventGuestRow[]> {
  if (input.guestIds.length === 0) return []

  const updated = await tx
    .update(eventGuests)
    .set({ status: 'salio', checkedOutAt: input.at, checkedOutBy: input.checkedOutBy })
    .where(and(
      eq(eventGuests.tenantId, input.tenantId),
      inArray(eventGuests.id, input.guestIds),
      eq(eventGuests.status, 'dentro'),
    ))
    .returning()

  const logIds = updated.map(g => g.accessLogId).filter((v): v is string => v !== null)
  if (logIds.length > 0) {
    await tx
      .update(accessLogs)
      .set({ exitAt: input.at })
      .where(and(
        eq(accessLogs.tenantId, input.tenantId),
        inArray(accessLogs.id, logIds),
        isNull(accessLogs.exitAt),
      ))
  }

  return updated
}

/**
 * Avisa por WS a las pantallas de accesos que esos registros ya tienen salida.
 * Usa 'access-exit' (actualiza la fila existente) en lugar de 'access-event' para no
 * llenar el feed en vivo con decenas de filas en una salida masiva.
 */
export function broadcastGuestLogExits(rows: EventGuestRow[]): void {
  for (const row of rows) {
    if (row.accessLogId && row.checkedOutAt) {
      broadcastAccessMessage('access-exit', { id: row.accessLogId, exitAt: row.checkedOutAt.toISOString() })
    }
  }
}

/**
 * Cierre automatico perezoso (sin cron) de invitados que quedaron 'dentro'.
 *
 * Cuando un evento terminado supera EVENT_GUARD_CHECKOUT_WINDOW_MS, vigilancia deja de
 * verlo y nadie puede registrar ya esas salidas. Se marcan como 'salio' con
 * checkedOutBy = null (salida automatica) y hora max(endsAt, checkedInAt).
 *
 * Acotado por tenant, en una transaccion e idempotente: si no hay candidatos solo
 * cuesta un SELECT indexado. Se llama desde expireEvents().
 *
 * Tras el commit avisa por push al propietario responsable de cada evento (un aviso por
 * evento). El aviso no se espera: no retrasa la respuesta y, si falla, solo queda en log.
 */
export async function autoCheckoutStaleGuests(tenantId: string, now: Date = new Date()): Promise<number> {
  const candidates = await db
    .select({
      id: eventGuests.id,
      checkedInAt: eventGuests.checkedInAt,
      endsAt: events.endsAt,
    })
    .from(eventGuests)
    .innerJoin(events, eq(eventGuests.eventId, events.id))
    .where(and(
      eq(eventGuests.tenantId, tenantId),
      eq(events.tenantId, tenantId),
      eq(eventGuests.status, 'dentro'),
      lt(events.endsAt, autoCheckoutCutoff(now)),
    ))

  if (candidates.length === 0) return 0

  // Agrupa por hora de salida: casi todos comparten endsAt, asi que son pocos UPDATE.
  const byExitTime = new Map<number, string[]>()
  for (const c of candidates) {
    const at = autoCheckoutAt(c.endsAt, c.checkedInAt).getTime()
    const ids = byExitTime.get(at)
    if (ids) ids.push(c.id)
    else byExitTime.set(at, [c.id])
  }

  const closed = await db.transaction(async (tx) => {
    const rows: EventGuestRow[] = []
    for (const [at, guestIds] of byExitTime) {
      rows.push(...await markGuestsExited(tx, { tenantId, guestIds, at: new Date(at), checkedOutBy: null }))
    }
    return rows
  })

  broadcastGuestLogExits(closed)
  // Solo las filas que este cierre cambio: un cierre paralelo que no cerro nada no avisa.
  void notifyAutoCheckout(tenantId, closed)
  return closed.length
}
