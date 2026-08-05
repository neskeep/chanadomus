import webpush from 'web-push'
import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../db'
import { pushSubscriptions } from '../db/schema/push'
import { pushPreferences } from '../db/schema/push-preferences'
import type { PushCategory } from '~~/shared/types/push-preferences'

// Configure VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@chanadomus.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string // ruta a abrir al tocar la notificacion
  category?: string
}

/**
 * Maps push payload categories to push_preferences column names.
 * Allows callers to use existing category strings while filtering by preferences.
 */
const CATEGORY_TO_PREF_COLUMN: Record<string, PushCategory> = {
  // Direct matches
  acceso: 'acceso',
  anuncio: 'anuncio',
  incidencia: 'incidencia',
  votacion: 'votacion',
  panico: 'panico',
  finanzas: 'finanzas',
  chat: 'chat',
  // Legacy/alternate category names used across modules
  announcement: 'anuncio',
  incident: 'incidencia',
  incident_created: 'incidencia',
  incident_update: 'incidencia',
  poll: 'votacion',
  poll_published: 'votacion',
  poll_closed: 'votacion',
  soporte: 'soporte',
  soporte_update: 'soporte',
}

/**
 * Filters out subscriptions for users who have disabled a given push category.
 * If no preference record exists for a user, all categories are treated as enabled (default).
 */
async function filterByPreferences(
  subs: typeof pushSubscriptions.$inferSelect[],
  category: PushCategory,
): Promise<typeof pushSubscriptions.$inferSelect[]> {
  if (subs.length === 0) return subs

  const userIds = [...new Set(subs.map(s => s.userId))]

  // Fetch preferences for all relevant users
  const prefs = await db
    .select({
      userId: pushPreferences.userId,
      acceso: pushPreferences.acceso,
      anuncio: pushPreferences.anuncio,
      incidencia: pushPreferences.incidencia,
      votacion: pushPreferences.votacion,
      panico: pushPreferences.panico,
      finanzas: pushPreferences.finanzas,
      chat: pushPreferences.chat,
      soporte: pushPreferences.soporte,
    })
    .from(pushPreferences)
    .where(inArray(pushPreferences.userId, userIds))

  // Build a set of users who have explicitly disabled this category
  const disabledUsers = new Set<string>()
  for (const pref of prefs) {
    if (!pref[category]) {
      disabledUsers.add(pref.userId)
    }
  }

  // Filter out subscriptions for disabled users
  // Users without a preference record are NOT filtered (default = all enabled)
  return subs.filter(s => !disabledUsers.has(s.userId))
}

/**
 * Envia push notification a todos los suscriptores con un rol especifico
 */
export async function sendPushToRole(tenantId: string, role: string, payload: PushPayload, category?: PushCategory) {
  let subs = await db.select().from(pushSubscriptions)
    .where(and(
      eq(pushSubscriptions.tenantId, tenantId),
      eq(pushSubscriptions.role, role),
    ))

  // Resolve category from payload if not explicitly provided
  const resolvedCategory = category ?? resolveCategoryFromPayload(payload)
  if (resolvedCategory) {
    subs = await filterByPreferences(subs, resolvedCategory)
  }

  return sendPushToSubscriptions(subs, payload)
}

/**
 * Envia push notification a un usuario especifico
 * Direct notifications are always sent (no preference filtering)
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subs = await db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))

  return sendPushToSubscriptions(subs, payload)
}

/**
 * Envia push notification a usuarios especificos, con filtrado por preferencias.
 * Useful for chat: send to room members who are offline.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
  category?: PushCategory,
) {
  if (userIds.length === 0) return { sent: 0, failed: 0, total: 0 }

  let subs = await db.select().from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds))

  const resolvedCategory = category ?? resolveCategoryFromPayload(payload)
  if (resolvedCategory) {
    subs = await filterByPreferences(subs, resolvedCategory)
  }

  return sendPushToSubscriptions(subs, payload)
}

/**
 * Envia push notification a todos los suscriptores de un tenant
 */
export async function sendPushToAll(tenantId: string, payload: PushPayload, category?: PushCategory) {
  let subs = await db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.tenantId, tenantId))

  // Resolve category from payload if not explicitly provided
  const resolvedCategory = category ?? resolveCategoryFromPayload(payload)
  if (resolvedCategory) {
    subs = await filterByPreferences(subs, resolvedCategory)
  }

  return sendPushToSubscriptions(subs, payload)
}

/**
 * Resolves a PushCategory from the payload's category field using the mapping table.
 */
function resolveCategoryFromPayload(payload: PushPayload): PushCategory | undefined {
  if (!payload.category) return undefined
  return CATEGORY_TO_PREF_COLUMN[payload.category]
}

async function sendPushToSubscriptions(
  subs: typeof pushSubscriptions.$inferSelect[],
  payload: PushPayload,
) {
  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        )
        return { id: sub.id, success: true }
      } catch (error: unknown) {
        // 410 Gone = subscription expired, limpiar
        if (error instanceof webpush.WebPushError && error.statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
        }
        return { id: sub.id, success: false, error }
      }
    }),
  )

  const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  const failed = results.length - sent

  return { sent, failed, total: results.length }
}

/** Expone la clave publica para el cliente */
export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY
}
