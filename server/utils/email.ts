import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export async function sendSupportTicketEmail(ticket: {
  title: string
  type: string
  priority: string
  description: string
  reporterName: string
  reporterEmail: string
}) {
  const resend = getResend()
  if (!resend) return

  const typeLabels: Record<string, string> = {
    bug: 'Error',
    sugerencia: 'Sugerencia',
    pregunta: 'Pregunta',
  }

  const priorityLabels: Record<string, string> = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    critica: 'Crítica',
  }

  await resend.emails.send({
    from: 'ChanaDomus Soporte <soporte@zunamicorp.com>',
    to: 'isenior@zunamicorp.com',
    subject: `[Soporte] ${typeLabels[ticket.type] ?? ticket.type}: ${ticket.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color: #19C2C0; margin-bottom: 4px;">Nuevo ticket de soporte</h2>
        <p style="color: #666; margin-top: 0;">ChanaDomus — Ranchos de Chana</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 6px 12px; font-weight: bold; color: #333;">Tipo</td>
            <td style="padding: 6px 12px;">${typeLabels[ticket.type] ?? ticket.type}</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-weight: bold; color: #333;">Prioridad</td>
            <td style="padding: 6px 12px;">${priorityLabels[ticket.priority] ?? ticket.priority}</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-weight: bold; color: #333;">Reportado por</td>
            <td style="padding: 6px 12px;">${ticket.reporterName} (${ticket.reporterEmail})</td>
          </tr>
        </table>
        <h3 style="margin-bottom: 8px;">${ticket.title}</h3>
        <p style="white-space: pre-wrap; background: #f9f9f9; padding: 12px; border-radius: 8px;">${ticket.description}</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">Revisa el ticket en <a href="https://chanadomus.com/admin/soporte">chanadomus.com/admin/soporte</a></p>
      </div>
    `,
  })
}
