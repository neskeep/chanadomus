import { db } from '~~/server/db'
import { events } from '~~/server/db/schema/event'
import { eq, and, lt } from 'drizzle-orm'

/**
 * Expiracion perezosa ("lazy expiration") de eventos.
 *
 * Transiciona de forma idempotente los eventos vencidos (status 'activo' con
 * endsAt pasado) a 'completado'. Debe llamarse ANTES de leer/listar eventos
 * para que el filtro por status y las etiquetas queden consistentes en admin
 * y propietario.
 *
 * Acotado por tenant. Es seguro llamarlo repetidamente (el filtro status='activo'
 * evita re-procesar eventos ya completados/cancelados).
 *
 * NOTA sobre check-out post-endsAt: completar el evento NO impide el check-out
 * de invitados que salen despues de endsAt. El guard de check-out se ajusto para
 * permitir salidas de invitados en estado 'dentro' aunque el evento este
 * 'completado' (ver server/api/events/[id]/checkout/[guestId].post.ts).
 */
export async function expireEvents(tenantId: string): Promise<void> {
  await db
    .update(events)
    .set({
      status: 'completado',
      updatedAt: new Date(),
    })
    .where(and(
      eq(events.tenantId, tenantId),
      eq(events.status, 'activo'),
      lt(events.endsAt, new Date()),
    ))
}
