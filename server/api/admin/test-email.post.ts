import { sendSupportTicketEmail } from '~~/server/utils/email'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const hasKey = !!process.env.RESEND_API_KEY
  const keyPrefix = process.env.RESEND_API_KEY?.slice(0, 10) ?? 'NOT SET'

  try {
    await sendSupportTicketEmail({
      title: 'Test diagnóstico de email',
      type: 'pregunta',
      priority: 'baja',
      description: 'Email de diagnóstico enviado desde endpoint temporal.',
      reporterName: 'Sistema',
      reporterEmail: 'sistema@chanadomus.com',
    })
    return { success: true, hasKey, keyPrefix }
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message, hasKey, keyPrefix }
  }
})
