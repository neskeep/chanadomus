import type { QrCodeRecord, QrStatus, GenerateQrInput } from '~~/shared/types/qr'

interface Unit {
  id: string
  number: string
  label: string | null
}

export function useQr() {
  const myCodes = ref<QrCodeRecord[]>([])
  const units = ref<Unit[]>([])
  const isGenerating = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function generateQr(input: GenerateQrInput) {
    isGenerating.value = true
    error.value = null

    try {
      const result = await $fetch('/api/qr/generate', {
        method: 'POST',
        body: input,
      })
      return result.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al generar el código QR'
      error.value = message
      throw err
    }
    finally {
      isGenerating.value = false
    }
  }

  async function fetchMyCodes(status: QrStatus | 'all' = 'all') {
    isLoading.value = true
    error.value = null

    try {
      const result = await $fetch('/api/qr/my-codes', {
        query: { status },
      })
      myCodes.value = result.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar las visitas'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchUnits() {
    try {
      const result = await $fetch('/api/units')
      units.value = result.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar las unidades'
      error.value = message
    }
  }

  return {
    myCodes,
    units,
    isGenerating,
    isLoading,
    error,
    generateQr,
    fetchMyCodes,
    fetchUnits,
  }
}
