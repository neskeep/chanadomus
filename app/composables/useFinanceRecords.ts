import type { RecordCategory, RecordType } from '~~/shared/types/financial'

interface CreateRecordBody {
  unitId: string
  type: RecordType
  category: RecordCategory
  amount: string
  description: string
  date: string
}

interface UpdateRecordBody {
  type?: RecordType
  category?: RecordCategory
  amount?: string
  description?: string
  date?: string
}

export function useFinanceRecords() {
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)
  let lastCreateKey = ''

  async function createRecord(body: CreateRecordBody) {
    // Prevenir doble submit con la misma data
    const dedupeKey = `${body.unitId}:${body.type}:${body.category}:${body.amount}:${body.description}:${body.date}`
    if (isSubmitting.value || dedupeKey === lastCreateKey) return
    lastCreateKey = dedupeKey

    isSubmitting.value = true
    error.value = null
    try {
      await $fetch('/api/finance/records', {
        method: 'POST',
        body,
      })
    }
    catch (err: unknown) {
      lastCreateKey = '' // Permitir reintento si cambió algo
      const message = err instanceof Error ? err.message : 'Error al crear registro financiero'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function updateRecord(id: string, body: UpdateRecordBody) {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/finance/records/${id}`, {
        method: 'PATCH',
        body,
      })
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar registro financiero'
      error.value = message
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  async function deleteRecord(id: string) {
    isSubmitting.value = true
    error.value = null
    try {
      await $fetch(`/api/finance/records/${id}`, {
        method: 'DELETE',
      })
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar registro financiero'
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
    updateRecord,
    deleteRecord,
  }
}
