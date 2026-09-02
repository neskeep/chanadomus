import { db } from '~~/server/db'
import { polls } from '~~/server/db/schema/poll'
import { eq, and, isNotNull, lt, sql } from 'drizzle-orm'

/**
 * Expiracion perezosa ("lazy expiration") de votaciones.
 *
 * Transiciona de forma idempotente los polls vencidos (status 'active' con
 * deadline pasado) a 'closed', fijando closedAt si aun no estaba seteado.
 * Debe llamarse ANTES de leer/listar polls para que el filtro por status,
 * las etiquetas y las pestanas del frontend queden consistentes.
 *
 * Acotado por tenant. Es seguro llamarlo repetidamente (no re-cierra ni pisa
 * closedAt de polls ya cerrados gracias al COALESCE y al filtro status='active').
 */
export async function expirePolls(tenantId: string): Promise<void> {
  await db
    .update(polls)
    .set({
      status: 'closed',
      closedAt: sql`COALESCE(${polls.closedAt}, now())`,
      updatedAt: new Date(),
    })
    .where(and(
      eq(polls.tenantId, tenantId),
      eq(polls.status, 'active'),
      isNotNull(polls.deadline),
      lt(polls.deadline, new Date()),
    ))
}
