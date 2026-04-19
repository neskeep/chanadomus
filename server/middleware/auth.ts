export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Public API routes (no auth required)
  if (path.startsWith('/api/auth')) return
  if (path === '/api/qr/validate') return

  // Only protect API routes (client routes handled by client middleware)
  if (!path.startsWith('/api/')) return

  const session = await getServerSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }

  // Attach session to event context for downstream handlers
  event.context.session = session
})
