import sharp from 'sharp'

const MAX_DIMENSION = 1920
const QUALITY = 80

interface ProcessedImage {
  buffer: Buffer
  width: number
  height: number
  size: number
}

/**
 * Converts any supported image (JPEG, PNG, WebP, HEIC, AVIF, TIFF, GIF)
 * to optimized WebP at a maximum of 1920px on the longest side.
 */
export async function processImageToWebP(input: Buffer): Promise<ProcessedImage> {
  const image = sharp(input, { failOn: 'none' })
  const metadata = await image.metadata()

  const width = metadata.width ?? 0
  const height = metadata.height ?? 0

  // Only resize if exceeds max dimension
  const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION

  let pipeline = image.rotate() // auto-rotate based on EXIF

  if (needsResize) {
    pipeline = pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  const buffer = await pipeline
    .webp({ quality: QUALITY, effort: 4 })
    .toBuffer()

  // Get final dimensions
  const outputMeta = await sharp(buffer).metadata()

  return {
    buffer,
    width: outputMeta.width ?? 0,
    height: outputMeta.height ?? 0,
    size: buffer.length,
  }
}
