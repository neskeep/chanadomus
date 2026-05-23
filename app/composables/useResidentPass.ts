import type { ResidentPass } from '~~/shared/types/resident-pass'

interface ResidentPassResponse {
  id: string
  token: string
  expiresAt: string
  createdAt: string
  unitId: string
  unitNumber: string
  unitLabel: string | null
}

export function useResidentPass() {
  const pass = ref<ResidentPassResponse | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMyPass() {
    isLoading.value = true
    error.value = null

    try {
      const result = await $fetch('/api/resident-pass/my-pass')
      pass.value = result.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener pase de residente'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  async function regeneratePass() {
    isLoading.value = true
    error.value = null

    try {
      const result = await $fetch('/api/resident-pass/regenerate', {
        method: 'POST',
      })
      pass.value = result.data
      return result.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al regenerar pase de residente'
      error.value = message
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    pass,
    isLoading,
    error,
    fetchMyPass,
    regeneratePass,
  }
}
