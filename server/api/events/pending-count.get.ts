import { eq, and, count } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events } from '~~/server/db/schema/event'

/**
 * Conteo de eventos pendientes de aprobacion (solo admin).
 *
 * Alimenta el badge y el aviso in-app suave para que administracion no pase por
 * alto eventos por validar (no es una actividad habitual).
 */
export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const [row] = await db
    .select({ count: count() })
    .from(events)
    .where(and(
      eq(events.tenantId, session.tenantId),
      eq(events.status, 'pendiente'),
    ))

  return { count: row?.count ?? 0 }
})
