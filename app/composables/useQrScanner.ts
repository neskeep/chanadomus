import jsQR from 'jsqr'
import type { ValidationResult } from '~~/shared/types/qr'

export function useQrScanner() {
  const isScanning = ref(false)
  const scanResult = ref<ValidationResult | null>(null)
  const isProcessing = ref(false)
  const error = ref<string | null>(null)
  const videoRef = ref<HTMLVideoElement | null>(null)
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const facingMode = ref<'user' | 'environment'>('environment')
  const selectedDirection = ref<'entry' | 'exit' | null>(null)

  let stream: MediaStream | null = null
  let scanInterval: ReturnType<typeof setInterval> | null = null

  async function startScanning() {
    error.value = null
    scanResult.value = null

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        error.value = 'La cámara requiere una conexión segura (HTTPS). Verifica que estés accediendo por HTTPS.'
        return
      }

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode.value },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.value) {
        videoRef.value.srcObject = stream
        await videoRef.value.play()
        isScanning.value = true
        startScanLoop()
      }
    }
    catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          error.value = 'Permiso de cámara denegado. Habilita el acceso a la cámara en la configuración del navegador.'
        }
        else if (err.name === 'NotFoundError') {
          error.value = 'No se encontró una cámara disponible en este dispositivo.'
        }
        else {
          error.value = `Error al acceder a la cámara: ${err.message}`
        }
      }
      else {
        error.value = 'Error desconocido al acceder a la cámara.'
      }
    }
  }

  function stopScanning() {
    if (scanInterval) {
      clearInterval(scanInterval)
      scanInterval = null
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      stream = null
    }

    if (videoRef.value) {
      videoRef.value.srcObject = null
    }

    isScanning.value = false
  }

  async function toggleCamera() {
    facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
    if (isScanning.value) {
      stopScanning()
      await startScanning()
    }
  }

  function startScanLoop() {
    if (scanInterval) clearInterval(scanInterval)

    scanInterval = setInterval(() => {
      if (!videoRef.value || !canvasRef.value || isProcessing.value || scanResult.value) return

      const video = videoRef.value
      const canvas = canvasRef.value
      const ctx = canvas.getContext('2d')
      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })

      if (code?.data) {
        handleQrDetected(code.data)
      }
    }, 200)
  }

  async function handleQrDetected(rawData: string) {
    isProcessing.value = true
    error.value = null

    // Extract token from URL or use raw value
    let token = rawData
    try {
      const url = new URL(rawData)
      const pathParts = url.pathname.split('/')
      const accesIdx = pathParts.indexOf('acceso')
      const tokenSegment = pathParts[accesIdx + 1]
      if (accesIdx !== -1 && tokenSegment) {
        token = tokenSegment
      }
    }
    catch {
      // rawData is not a URL, use as-is
    }

    try {
      const result = await $fetch('/api/qr/validate', {
        method: 'POST',
        body: { token, direction: selectedDirection.value },
      })
      scanResult.value = result.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al validar el código QR'
      error.value = message
      scanResult.value = { status: 'invalid' }
    }
    finally {
      isProcessing.value = false
    }
  }

  function resetScan() {
    scanResult.value = null
    error.value = null
    isProcessing.value = false
  }

  function resetToSelection() {
    stopScanning()
    selectedDirection.value = null
    scanResult.value = null
    error.value = null
    isProcessing.value = false
  }

  onUnmounted(() => {
    stopScanning()
  })

  return {
    isScanning,
    scanResult,
    isProcessing,
    error,
    videoRef,
    canvasRef,
    facingMode,
    selectedDirection,
    startScanning,
    stopScanning,
    toggleCamera,
    resetScan,
    resetToSelection,
  }
}
