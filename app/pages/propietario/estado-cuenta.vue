<script setup lang="ts">
import { Wallet } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const { balance, records, isInDebt, isLoading, error, fetchStatement } = useMyAccount()

onMounted(() => {
  fetchStatement()
})

const formattedBalance = computed(() => {
  const num = parseFloat(balance.value)
  const abs = Math.abs(num).toLocaleString('es-VE', { minimumFractionDigits: 2 })
  return `${num < 0 ? '-' : ''} Bs ${abs}`
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="mx-auto max-w-lg">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-xl font-semibold tracking-tight">Estado de Cuenta</h1>
      <p class="mt-1 text-sm text-muted-foreground">Resumen de cargos y abonos de tu unidad</p>
    </div>

    <!-- Error alert -->
    <div
      v-if="error"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Loading skeletons -->
    <div v-if="isLoading" class="mt-6 space-y-4">
      <!-- Balance skeleton -->
      <div class="animate-pulse rounded-lg border p-6 text-center">
        <div class="mx-auto h-3 w-20 rounded bg-muted" />
        <div class="mx-auto mt-3 h-8 w-32 rounded bg-muted" />
        <div class="mx-auto mt-3 h-5 w-16 rounded-full bg-muted" />
      </div>
      <!-- Movement skeletons -->
      <div v-for="i in 3" :key="i" class="flex items-center justify-between border-b py-4">
        <div class="space-y-2">
          <div class="h-4 w-36 rounded bg-muted" />
          <div class="h-3 w-24 rounded bg-muted" />
        </div>
        <div class="h-4 w-20 rounded bg-muted" />
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Balance Hero Card -->
      <Card class="mt-6">
        <CardContent class="p-6 text-center">
          <p class="text-sm text-muted-foreground">Saldo actual</p>
          <p
            class="mt-2 text-3xl font-bold tracking-tight"
            :class="isInDebt ? 'text-destructive' : 'text-primary'"
          >
            {{ formattedBalance }}
          </p>
          <Badge :variant="isInDebt ? 'destructive' : 'default'" class="mt-3">
            {{ isInDebt ? 'En mora' : 'Al dia' }}
          </Badge>
        </CardContent>
      </Card>

      <!-- Movements list -->
      <div class="mt-8">
        <h2 class="text-sm font-medium text-muted-foreground">Movimientos</h2>
        <Separator class="mt-2" />

        <!-- Empty state -->
        <div
          v-if="records.length === 0"
          class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center mt-6"
        >
          <div class="flex size-12 items-center justify-center rounded-full bg-muted">
            <Wallet class="size-6 text-muted-foreground" />
          </div>
          <div>
            <p class="font-medium">No hay movimientos registrados</p>
            <p class="mt-1 text-sm text-muted-foreground">Los cargos y abonos apareceran aqui</p>
          </div>
        </div>

        <!-- Movement items -->
        <template v-else>
          <div
            v-for="record in records"
            :key="record.id"
            class="flex items-start justify-between gap-3 border-b py-4 last:border-0"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium">{{ record.description }}</p>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ formatDate(record.date) }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p
                class="text-sm font-semibold"
                :class="record.type === 'abono' ? 'text-primary' : 'text-destructive'"
              >
                {{ record.type === 'abono' ? '+' : '-' }} Bs {{ record.amount }}
              </p>
              <Badge
                :variant="record.type === 'abono' ? 'default' : 'outline'"
                class="mt-1"
              >
                {{ record.type === 'abono' ? 'Abono' : 'Cargo' }}
              </Badge>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
