import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/db'
import { pushSubscriptions } from '~~/server/db/schema/push'

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const body = await readBody<{ endpoint: string }>(event)

  if (!body.endpoint?.trim()) {
    throw createError({ statusCode: 400, message: 'endpoint es requerido' })
  }

  await db.delete(pushSubscriptions)
    .where(and(
      eq(pushSubscriptions.userId, session.user.id),
      eq(pushSubscriptions.endpoint, body.endpoint),
    ))

  return { data: { unsubscribed: true } }
})
