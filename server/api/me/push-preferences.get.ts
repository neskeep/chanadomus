import { db } from '~~/server/db'
import { pushPreferences } from '~~/server/db/schema/push-preferences'
import { eq, and } from 'drizzle-orm'
import type { PushPreferences } from '~~/shared/types/push-preferences'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  // Get or create push preferences
  const [existing] = await db
    .select()
    .from(pushPreferences)
    .where(and(
      eq(pushPreferences.userId, session.user.id),
      eq(pushPreferences.tenantId, session.tenantId),
    ))

  if (existing) {
    const prefs: PushPreferences = {
      acceso: existing.acceso,
      anuncio: existing.anuncio,
      incidencia: existing.incidencia,
      votacion: existing.votacion,
      panico: existing.panico,
      finanzas: existing.finanzas,
      chat: existing.chat,
      soporte: existing.soporte,
    }
    return { data: prefs }
  }

  // Create with defaults (all enabled)
  const [created] = await db
    .insert(pushPreferences)
    .values({
      userId: session.user.id,
      tenantId: session.tenantId,
    })
    .returning()

  if (!created) {
    throw createError({ statusCode: 500, message: 'Error al crear preferencias de notificaciones' })
  }

  const prefs: PushPreferences = {
    acceso: created.acceso,
    anuncio: created.anuncio,
    incidencia: created.incidencia,
    votacion: created.votacion,
    panico: created.panico,
    finanzas: created.finanzas,
    chat: created.chat,
    soporte: created.soporte,
  }

  return { data: prefs }
})
