import { db } from '~~/server/db'
import { broadcasts } from '~~/server/db/schema/broadcast'
import { sendPushToAll } from '~~/server/utils/web-push'

interface BroadcastBody {
  title: string
  body: string
}

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const { title, body } = await readBody<BroadcastBody>(event)

  if (!title?.trim()) {
    throw createError({ statusCode: 400, message: 'El título es requerido' })
  }
  if (!body?.trim()) {
    throw createError({ statusCode: 400, message: 'El mensaje es requerido' })
  }

  // Save broadcast to DB
  const [broadcast] = await db.insert(broadcasts)
    .values({
      title: title.trim(),
      body: body.trim(),
      authorId: session.user.id,
      tenantId: session.tenantId,
    })
    .returning()

  // Send push notification to all subscribers
  const result = await sendPushToAll(session.tenantId, {
    title: title.trim(),
    body: body.trim(),
    icon: '/icons/icon-192x192.png',
    url: '/',
    category: 'anuncio',
  }, 'anuncio')

  return {
    data: {
      broadcast,
      push: result,
    },
  }
})
