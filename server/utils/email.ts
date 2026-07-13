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

  const priorityColors: Record<string, string> = {
    baja: '#22c55e',
    media: '#f59e0b',
    alta: '#f97316',
    critica: '#ef4444',
  }

  const typeIcons: Record<string, string> = {
    bug: '🐛',
    sugerencia: '💡',
    pregunta: '❓',
  }

  const typeLabel = typeLabels[ticket.type] ?? ticket.type
  const priorityLabel = priorityLabels[ticket.priority] ?? ticket.priority
  const priorityColor = priorityColors[ticket.priority] ?? '#6b7280'
  const typeIcon = typeIcons[ticket.type] ?? '📩'

  await resend.emails.send({
    from: 'ChanaDomus Soporte <soporte@zunamicorp.com>',
    to: 'isenior@zunamicorp.com',
    subject: `${typeIcon} ${typeLabel}: ${ticket.title}`,
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr><td style="background:#0f172a;padding:20px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="color:#19C2C0;font-size:18px;font-weight:700;letter-spacing:-0.3px;">ChanaDomus</td>
        <td align="right" style="color:#94a3b8;font-size:12px;">Nuevo ticket</td>
      </tr>
    </table>
  </td></tr>

  <!-- Badges -->
  <tr><td style="padding:20px 28px 0;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="background:#f0fdf4;color:#15803d;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;border:1px solid #bbf7d0;">${typeIcon} ${typeLabel}</td>
      <td width="8"></td>
      <td style="background:${priorityColor}12;color:${priorityColor};font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;border:1px solid ${priorityColor}33;">Prioridad: ${priorityLabel}</td>
    </tr></table>
  </td></tr>

  <!-- Title -->
  <tr><td style="padding:16px 28px 0;">
    <p style="margin:0;font-size:17px;font-weight:700;color:#0f172a;line-height:1.4;">${ticket.title}</p>
  </td></tr>

  <!-- Description -->
  <tr><td style="padding:12px 28px 0;">
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;">
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.6;white-space:pre-wrap;">${ticket.description}</p>
    </div>
  </td></tr>

  <!-- Reporter -->
  <tr><td style="padding:16px 28px;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="width:32px;height:32px;background:#19C2C0;border-radius:50%;text-align:center;vertical-align:middle;color:#fff;font-size:13px;font-weight:700;">${ticket.reporterName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</td>
      <td width="10"></td>
      <td>
        <p style="margin:0;font-size:13px;font-weight:600;color:#0f172a;">${ticket.reporterName}</p>
        <p style="margin:0;font-size:12px;color:#64748b;">${ticket.reporterEmail}</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:0 28px 24px;">
    <a href="https://chanadomus.com/admin/soporte" style="display:inline-block;background:#0f172a;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">Ver ticket →</a>
  </td></tr>

</table>

<!-- Footer -->
<p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:16px;">ChanaDomus — Ranchos de Chana · Powered by Zunami Corp</p>

</td></tr>
</table>
</body></html>
    `,
  })
}
