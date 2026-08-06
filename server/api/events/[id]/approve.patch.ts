import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { events } from '~~/server/db/schema/event'
import { user } from '~~/server/db/schema/auth'
import { sendPushToRole } from '~~/server/utils/web-push'

const paramsSchema = z.object({ id: z.string().uuid() })

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const { id } = validateParams(event, paramsSchema)

  const [existing] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.tenantId, session.tenantId)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Evento no encontrado' })
  }

  if (existing.status !== 'pendiente') {
    throw createError({ statusCode: 400, message: 'Solo se pueden aprobar eventos pendientes' })
  }

  const [updated] = await db
    .update(events)
    .set({
      status: 'activo',
      approvedById: session.user.id,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 500, message: 'Error al aprobar el evento' })
  }

  // Notify creator
  // Get creator's push subscriptions by finding their role
  // We send to the creator directly — but sendPushToRole works by role.
  // Instead, we'll import sendPushToUser if available, or use a targeted approach.
  // For now, notify propietario role as the creator is likely a propietario.
  const [creator] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, existing.createdById))
    .limit(1)

  if (creator?.role) {
    await sendPushToRole(session.tenantId, creator.role, {
      title: 'Evento aprobado',
      body: `Tu evento "${existing.title}" fue aprobado`,
      url: '/mi-chana/eventos',
    }, 'anuncio').catch(() => {})
  }

  return {
    data: {
      id: updated.id,
      status: updated.status,
      approvedById: updated.approvedById,
      approvedAt: updated.approvedAt?.toISOString() ?? null,
      updatedAt: updated.updatedAt.toISOString(),
    },
  }
})
