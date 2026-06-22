import type { RecordType, RecordCategory, BulkCreateBody, BulkCreateResult, BulkUpdateResult, BulkDeleteResult } from '~~/shared/types/financial'

export function useFinanceBulk() {
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  async function bulkCreate(body: BulkCreateBody): Promise<BulkCreateResult> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: BulkCreateResult }>('/api/finance/records/bulk', {
        method: 'POST',
        body,
      })
      return res.data
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error en operación masiva'
      error.value = msg
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  async function bulkUpdate(ids: string[], updates: { date?: string; type?: RecordType; category?: RecordCategory; amount?: number }): Promise<BulkUpdateResult> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: BulkUpdateResult }>('/api/finance/records/bulk', {
        method: 'PATCH',
        body: { ids, updates },
      })
      return res.data
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar registros'
      error.value = msg
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  async function bulkDelete(ids: string[]): Promise<BulkDeleteResult> {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: BulkDeleteResult }>('/api/finance/records/bulk-delete', {
        method: 'POST',
        body: { ids },
      })
      return res.data
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar registros'
      error.value = msg
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  return { isSubmitting, error, bulkCreate, bulkUpdate, bulkDelete }
}
