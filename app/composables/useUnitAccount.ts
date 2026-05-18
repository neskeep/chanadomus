import type { AccountStatement } from '~~/shared/types/financial'

export function useUnitAccount() {
  const statement = ref<AccountStatement | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAccount(unitId: string, params?: { from?: string, to?: string }) {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: AccountStatement }>(`/api/finance/unit-account/${unitId}`, {
        query: params,
      })
      statement.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar estado de cuenta'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    statement,
    isLoading,
    error,
    fetchAccount,
  }
}
