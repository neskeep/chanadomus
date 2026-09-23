import QRCode from 'qrcode'

export type ShareVisitPassResult = 'shared' | 'copied' | 'dismissed' | 'failed'

/**
 * Enlace público de un pase de visita (/acceso/[token]) y cómo compartirlo:
 * menú nativo de compartir si existe, si no copia al portapapeles.
 */
export function useShareVisitPass() {
  function accessUrl(token: string): string {
    return `${window.location.origin}/acceso/${token}`
  }

  async function copyText(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.className = 'fixed opacity-0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    }
    catch {
      return false
    }
  }

  async function sharePass(token: string): Promise<ShareVisitPassResult> {
    const url = accessUrl(token)
    const text = `¡Hola! Te comparto tu acceso a Ranchos de Chana. Muestra este enlace en la alcabala: ${url}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Acceso Ranchos de Chana', text, url })
        return 'shared'
      }
      catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return 'dismissed'
      }
    }
    return (await copyText(text)) ? 'copied' : 'failed'
  }

  /** Imagen PNG (data URL) del QR que apunta al enlace de acceso. */
  function qrImage(token: string, width = 256): Promise<string> {
    return QRCode.toDataURL(accessUrl(token), { width, margin: 2 })
  }

  return { accessUrl, sharePass, qrImage }
}
