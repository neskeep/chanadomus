<script setup lang="ts">
import { Wallet } from 'lucide-vue-next'

useHead({ title: 'Estado de Cuenta' })

const { balance, records, isInDebt, isLoading, error, fetchStatement } = useMyAccount()

onMounted(() => {
  fetchStatement()
})

const { formatDate, formatCurrency } = useFormatDate()

const formattedBalance = computed(() => {
  const num = parseFloat(balance.value)
  const prefix = num < 0 ? '- ' : ''
  return `${prefix}${formatCurrency(Math.abs(num))}`
})
</script>

<template>
  <div>
    <ErrorAlert :message="error" class="mb-4" />

    <!-- Loading skeletons -->
    <div v-if="isLoading" class="space-y-4">
      <!-- Balance skeleton -->
      <div class="animate-pulse rounded-lg border p-6 text-center">
        <div class="mx-auto h-3 w-20 rounded bg-muted" />
        <div class="mx-auto mt-3 h-8 w-32 rounded bg-muted" />
        <div class="mx-auto mt-3 h-5 w-16 rounded-lg bg-muted" />
      </div>
      <!-- Movement skeletons -->
      <ListSkeleton :count="3" />
    </div>

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Balance Hero Card -->
      <Card class="p-6 text-center">
        <p class="text-sm text-muted-foreground">Saldo actual</p>
        <p
          class="mt-2 text-3xl font-bold tracking-tight tabular-nums"
          :class="isInDebt ? 'text-destructive' : 'text-primary'"
        >
          {{ formattedBalance }}
        </p>
        <Badge :variant="isInDebt ? 'destructive' : 'default'" class="mt-3">
          {{ isInDebt ? 'En mora' : 'Al día' }}
        </Badge>
      </Card>

      <!-- Movements -->
      <EmptyState
        v-if="records.length === 0"
        :icon="Wallet"
        title="Sin movimientos"
        description="Tus cargos y pagos aparecerán aquí"
        class="mt-4"
      />

      <div v-else class="mt-4 space-y-2">
        <Card v-for="record in records" :key="record.id">
          <CardContent class="px-3 py-2.5">
            <div class="flex items-center justify-between gap-2">
              <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ record.description }}</p>
              <span
                class="shrink-0 text-sm font-semibold tabular-nums"
                :class="record.type === 'abono' ? 'text-primary' : 'text-destructive'"
              >
                {{ record.type === 'abono' ? '+' : '-' }} $ {{ record.amount }}
              </span>
            </div>
            <div class="mt-0.5 flex items-center gap-x-2">
              <span class="text-[11px] text-muted-foreground tabular-nums">{{ formatDate(record.date) }}</span>
              <Badge
                :variant="record.type === 'abono' ? 'default' : 'outline'"
                class="h-4 px-1.5 text-[10px]"
              >
                {{ record.type === 'abono' ? 'Abono' : 'Cargo' }}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
