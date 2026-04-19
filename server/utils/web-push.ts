import webpush from 'web-push'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { pushSubscriptions } from '../db/schema/push'

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
 * Envia push notification a todos los suscriptores con un rol especifico
 */
export async function sendPushToRole(tenantId: string, role: string, payload: PushPayload) {
  const subs = await db.select().from(pushSubscriptions)
    .where(and(
      eq(pushSubscriptions.tenantId, tenantId),
      eq(pushSubscriptions.role, role),
    ))

  return sendPushToSubscriptions(subs, payload)
}

/**
 * Envia push notification a un usuario especifico
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subs = await db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))

  return sendPushToSubscriptions(subs, payload)
}

/**
 * Envia push notification a todos los suscriptores de un tenant
 */
export async function sendPushToAll(tenantId: string, payload: PushPayload) {
  const subs = await db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.tenantId, tenantId))

  return sendPushToSubscriptions(subs, payload)
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
