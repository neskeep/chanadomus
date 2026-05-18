<script setup lang="ts">
import {
  FileText,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-vue-next'

const route = useRoute()
const unitId = route.params.id as string

const { summaries, isLoading: summaryLoading, fetchSummary } = useFinanceSummary()
const { statement, isLoading: accountLoading, error: accountError, fetchAccount } = useUnitAccount()
const { formatCurrency, formatDate } = useFormatDate()

useHead({ title: 'Estado de Cuenta' })

// Find the selected unit from summaries
const selectedUnit = computed(() =>
  summaries.value.find(s => s.unitId === unitId) ?? null,
)

function formatBalance(balance: string): string {
  const num = parseFloat(balance)
  const prefix = num < 0 ? '- ' : ''
  return `${prefix}${formatCurrency(Math.abs(num))}`
}

onMounted(async () => {
  await fetchSummary()
  fetchAccount(unitId)
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="summaryLoading" class="space-y-4">
      <Skeleton class="h-16 w-full" />
      <Skeleton class="h-32 w-full" />
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Balance summary -->
      <Card v-if="selectedUnit" class="mb-4">
        <CardContent class="p-5 md:p-8">
          <div class="flex flex-wrap items-center gap-3">
            <div>
              <p class="text-sm text-muted-foreground">
                {{ selectedUnit.unitLabel || `Rancho ${selectedUnit.unitNumber}` }}
              </p>
              <p
                class="text-2xl font-bold tabular-nums"
                :class="selectedUnit.isInDebt ? 'text-destructive' : 'text-primary'"
              >
                {{ formatBalance(selectedUnit.balance) }}
              </p>
            </div>
            <Badge :variant="selectedUnit.isInDebt ? 'destructive' : 'default'">
              {{ selectedUnit.isInDebt ? 'En mora' : 'Al día' }}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <!-- Records -->
      <Card>
        <CardContent class="p-5 md:p-8">
          <p class="mb-4 text-base font-semibold">Movimientos</p>

          <!-- Loading records -->
          <ListSkeleton v-if="accountLoading" :count="4" variant="row" />

          <!-- Error -->
          <ErrorAlert v-else-if="accountError" :message="accountError" />

          <!-- Empty state -->
          <EmptyState
            v-else-if="statement && statement.records.length === 0"
            :icon="FileText"
            title="Sin movimientos"
            description="No hay movimientos registrados para esta unidad"
          />

          <!-- Records list -->
          <div v-else-if="statement" class="space-y-2">
            <Card v-for="record in statement.records" :key="record.id">
              <CardContent class="px-3 py-2.5">
                <div class="flex items-center gap-2">
                  <p class="min-w-0 flex-1 truncate text-sm font-medium">
                    {{ record.description }}
                  </p>
                  <Badge
                    :variant="record.type === 'cargo' ? 'destructive' : 'default'"
                    class="shrink-0 text-[11px]"
                  >
                    <ArrowDownRight v-if="record.type === 'cargo'" class="mr-0.5 size-3" />
                    <ArrowUpRight v-else class="mr-0.5 size-3" />
                    {{ record.type === 'cargo' ? 'Cargo' : 'Abono' }}
                  </Badge>
                  <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    {{ formatDate(record.date) }}
                  </span>
                </div>
                <p
                  class="mt-0.5 text-sm font-semibold tabular-nums"
                  :class="record.type === 'cargo' ? 'text-destructive' : 'text-primary'"
                >
                  {{ record.type === 'cargo' ? '- ' : '+ ' }}{{ formatCurrency(parseFloat(record.amount)) }}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
