const MAX_DIMENSION = 1920
const QUALITY = 0.8

const HEIC_TYPES = ['image/heic', 'image/heif']

function isHeic(file: File): boolean {
  if (HEIC_TYPES.includes(file.type)) return true
  return /\.hei[cf]$/i.test(file.name)
}

async function heicToJpeg(file: File): Promise<File> {
  const { default: heic2any } = await import('heic2any')
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
  const result = Array.isArray(blob) ? blob[0]! : blob
  const name = file.name.replace(/\.hei[cf]$/i, '.jpg')
  return new File([result], name, { type: 'image/jpeg' })
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Failed to compress image')),
      'image/webp',
      quality,
    )
  })
}

export function useImageCompress() {
  async function compressImage(file: File): Promise<File> {
    // Convert HEIC to JPEG first
    const input = isHeic(file) ? await heicToJpeg(file) : file

    const img = await loadImage(input)
    const { width, height } = img

    // Calculate scaled dimensions
    let newWidth = width
    let newHeight = height
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
      newWidth = Math.round(width * ratio)
      newHeight = Math.round(height * ratio)
    }

    const canvas = document.createElement('canvas')
    canvas.width = newWidth
    canvas.height = newHeight

    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, newWidth, newHeight)

    URL.revokeObjectURL(img.src)

    const blob = await canvasToBlob(canvas, QUALITY)
    const name = input.name.replace(/\.[^.]+$/, '.webp')

    return new File([blob], name, { type: 'image/webp' })
  }

  return { compressImage }
}
