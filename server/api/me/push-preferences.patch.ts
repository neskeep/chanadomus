import { db } from '~~/server/db'
import { pushPreferences } from '~~/server/db/schema/push-preferences'
import { eq, and } from 'drizzle-orm'
import type { PushCategory, PushPreferences } from '~~/shared/types/push-preferences'

const VALID_CATEGORIES: PushCategory[] = ['acceso', 'anuncio', 'incidencia', 'votacion', 'panico', 'finanzas', 'chat', 'soporte']

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const body = await readBody(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Datos invalidos' })
  }

  // Validate that all keys are valid categories and values are booleans
  const updateFields: Partial<Record<PushCategory, boolean>> = {}
  for (const [key, value] of Object.entries(body)) {
    if (!VALID_CATEGORIES.includes(key as PushCategory)) {
      throw createError({ statusCode: 400, message: `Categoria invalida: ${key}` })
    }
    if (typeof value !== 'boolean') {
      throw createError({ statusCode: 400, message: `El valor de ${key} debe ser booleano` })
    }
    updateFields[key as PushCategory] = value
  }

  if (Object.keys(updateFields).length === 0) {
    throw createError({ statusCode: 400, message: 'Se requiere al menos una categoria para actualizar' })
  }

  // Check if preferences exist
  const [existing] = await db
    .select({ id: pushPreferences.id })
    .from(pushPreferences)
    .where(and(
      eq(pushPreferences.userId, session.user.id),
      eq(pushPreferences.tenantId, session.tenantId),
    ))

  if (existing) {
    // Update existing
    const [updated] = await db
      .update(pushPreferences)
      .set({
        ...updateFields,
        updatedAt: new Date(),
      })
      .where(eq(pushPreferences.id, existing.id))
      .returning()

    if (!updated) {
      throw createError({ statusCode: 500, message: 'Error al actualizar preferencias' })
    }

    const prefs: PushPreferences = {
      acceso: updated.acceso,
      anuncio: updated.anuncio,
      incidencia: updated.incidencia,
      votacion: updated.votacion,
      panico: updated.panico,
      finanzas: updated.finanzas,
      chat: updated.chat,
      soporte: updated.soporte,
    }

    return { data: prefs }
  }

  // Create with defaults + overrides
  const [created] = await db
    .insert(pushPreferences)
    .values({
      userId: session.user.id,
      tenantId: session.tenantId,
      ...updateFields,
    })
    .returning()

  if (!created) {
    throw createError({ statusCode: 500, message: 'Error al crear preferencias' })
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
