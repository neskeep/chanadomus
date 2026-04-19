import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { pushSubscriptions } from '~~/server/db/schema/push'

interface SubscribeBody {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const body = await readBody<SubscribeBody>(event)

  if (!body.endpoint?.trim()) {
    throw createError({ statusCode: 400, message: 'endpoint es requerido' })
  }
  if (!body.keys?.p256dh?.trim() || !body.keys?.auth?.trim()) {
    throw createError({ statusCode: 400, message: 'keys (p256dh, auth) son requeridas' })
  }

  // Upsert: si ya existe una suscripcion con este endpoint para este usuario, actualizar
  const existing = await db.select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(and(
      eq(pushSubscriptions.userId, session.user.id),
      eq(pushSubscriptions.endpoint, body.endpoint),
    ))
    .limit(1)

  if (existing.length > 0) {
    await db.update(pushSubscriptions)
      .set({
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        role: session.user.role ?? 'propietario',
      })
      .where(eq(pushSubscriptions.id, existing[0]!.id))

    return { data: { id: existing[0]!.id, updated: true } }
  }

  const [sub] = await db.insert(pushSubscriptions)
    .values({
      userId: session.user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      role: session.user.role ?? 'propietario',
      tenantId: session.tenantId,
    })
    .returning({ id: pushSubscriptions.id })

  return { data: { id: sub!.id, created: true } }
})
