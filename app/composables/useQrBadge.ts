import QRCode from 'qrcode'

interface BadgeData {
  name: string
  roleName: string | null
  unitNumber?: string | null
  unitLabel?: string | null
  phone?: string | null
  qrToken: string
}

export function useQrBadge() {
  const isGenerating = ref(false)

  async function generateBadgeSvg(data: BadgeData): Promise<string> {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const accessUrl = `${origin}/acceso/${data.qrToken}`

    // Generate QR as SVG string
    const qrSvgRaw = await QRCode.toString(accessUrl, {
      type: 'svg',
      width: 180,
      margin: 1,
      color: { dark: '#1F2933', light: '#FFFFFF' },
    })

    // Extract viewBox and inner content, then create a clean nested SVG
    const viewBoxMatch = qrSvgRaw.match(/viewBox="([^"]*)"/)
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 180 180'
    const innerContent = qrSvgRaw.replace(/<\/?svg[^>]*>/g, '')
    const qrEmbedded = `<svg xmlns="http://www.w3.org/2000/svg" x="80" y="101" width="180" height="180" viewBox="${viewBox}">${innerContent}</svg>`

    const role = data.roleName ?? 'Sin rol'
    const unit = data.unitNumber
      ? `${data.unitNumber}${data.unitLabel ? ` — ${data.unitLabel}` : ''}`
      : null
    const phone = data.phone ?? null

    // Escape XML entities
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    // Build info lines
    let infoY = 340
    const infoLines: string[] = []

    // Name
    infoLines.push(`<text x="170" y="${infoY}" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" font-weight="700" fill="#1F2933">${esc(data.name)}</text>`)
    infoY += 28

    // Role badge
    const roleWidth = role.length * 8 + 24
    const roleX = 170 - roleWidth / 2
    infoLines.push(`<rect x="${roleX}" y="${infoY - 14}" width="${roleWidth}" height="22" rx="6" fill="#E0F7F7" />`)
    infoLines.push(`<text x="170" y="${infoY + 1}" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="600" fill="#12A7A5">${esc(role)}</text>`)
    infoY += 32

    // Unit
    if (unit) {
      infoLines.push(`<text x="170" y="${infoY}" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" fill="#616E7C">Unidad: ${esc(unit)}</text>`)
      infoY += 22
    }

    // Phone
    if (phone) {
      infoLines.push(`<text x="170" y="${infoY}" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" fill="#616E7C">Tel: ${esc(phone)}</text>`)
      infoY += 22
    }

    // Calculate dynamic height
    const totalHeight = Math.max(infoY + 40, 460)

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="${totalHeight}" viewBox="0 0 340 ${totalHeight}">
  <defs>
    <clipPath id="card-clip"><rect width="340" height="${totalHeight}" rx="16" /></clipPath>
  </defs>

  <!-- Card background -->
  <rect width="340" height="${totalHeight}" rx="16" fill="#FFFFFF" stroke="#E4E7EB" stroke-width="1" />

  <!-- Brand header -->
  <g clip-path="url(#card-clip)">
    <rect width="340" height="72" fill="#19C2C0" />
    <text x="170" y="36" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" font-weight="700" fill="#FFFFFF">ChanaDomus</text>
    <text x="170" y="56" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="400" fill="rgba(255,255,255,0.85)">Ranchos de Chana</text>
  </g>

  <!-- QR Code -->
  <rect x="71" y="92" width="198" height="198" rx="12" fill="#FFFFFF" stroke="#E4E7EB" stroke-width="1" />
  ${qrEmbedded}

  <!-- Separator -->
  <line x1="40" y1="310" x2="300" y2="310" stroke="#E4E7EB" stroke-width="1" />

  <!-- Staff info -->
  ${infoLines.join('\n  ')}

  <!-- Footer -->
  <line x1="40" y1="${totalHeight - 36}" x2="300" y2="${totalHeight - 36}" stroke="#E4E7EB" stroke-width="1" />
  <text x="170" y="${totalHeight - 14}" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" fill="#9AA5B1">Pase de acceso multi-uso</text>
</svg>`

    return svg
  }

  async function downloadBadge(data: BadgeData, format: 'svg' | 'png' = 'png') {
    isGenerating.value = true
    try {
      const svg = await generateBadgeSvg(data)
      const fileName = `pase-${data.name.toLowerCase().replace(/\s+/g, '-')}`

      if (format === 'svg') {
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        triggerDownload(blob, `${fileName}.svg`)
        return
      }

      // Convert SVG to PNG via canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')

      const scale = 3 // 3x for print quality
      const img = new Image()

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width * scale
          canvas.height = img.height * scale
          ctx.scale(scale, scale)
          ctx.drawImage(img, 0, 0)
          resolve()
        }
        img.onerror = reject
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
      })

      canvas.toBlob((blob) => {
        if (blob) triggerDownload(blob, `${fileName}.png`)
      }, 'image/png')
    }
    finally {
      isGenerating.value = false
    }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return {
    isGenerating,
    generateBadgeSvg,
    downloadBadge,
  }
}
