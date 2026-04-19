import type { RecordType } from '~~/shared/types/financial'

interface CreateRecordBody {
  unitId: string
  type: RecordType
  amount: string
  description: string
  date: string
}

export function useFinanceRecords() {
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function createRecord(body: CreateRecordBody) {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch('/api/finance/records', {
        method: 'POST',
        body,
      })
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear registro financiero'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    error,
    createRecord,
  }
}
