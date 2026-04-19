import type { AccountStatement } from '~~/shared/types/financial'

export function useMyAccount() {
  const statement = ref<AccountStatement | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchStatement() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: AccountStatement }>('/api/finance/my-account')
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

  const balance = computed(() => statement.value?.balance ?? '0.00')
  const records = computed(() => statement.value?.records ?? [])
  const isInDebt = computed(() => parseFloat(balance.value) < 0)

  return {
    statement,
    balance,
    records,
    isInDebt,
    isLoading,
    error,
    fetchStatement,
  }
}
