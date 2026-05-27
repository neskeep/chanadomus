<script setup lang="ts">
import { CalendarIcon, Wallet } from 'lucide-vue-next'
import type { DateValue } from 'reka-ui'

useHead({ title: 'Estado de Cuenta' })

const { balance, records, isInDebt, isLoading, error, fetchStatement } = useMyAccount()
const { formatDate, formatCurrency } = useFormatDate()
const { target, isMounted } = useTopbarPortal()

// --- Filters ---
const filterType = ref<'cargo' | 'abono' | ''>('')
const filterCategory = ref<'ordinaria' | 'extraordinaria' | ''>('')
const filterFrom = shallowRef<DateValue | undefined>()
const filterTo = shallowRef<DateValue | undefined>()
const fromPickerOpen = ref(false)
const toPickerOpen = ref(false)

const typeOptions = [
  { value: 'cargo', label: 'Cargos' },
  { value: 'abono', label: 'Abonos' },
]
const categoryOptions = [
  { value: 'ordinaria', label: 'Ordinaria' },
  { value: 'extraordinaria', label: 'Extraordinaria' },
]

const hasActiveFilters = computed(() =>
  filterType.value !== '' || filterCategory.value !== '' || filterFrom.value !== undefined || filterTo.value !== undefined,
)

function clearAllFilters() {
  filterType.value = ''
  filterCategory.value = ''
  filterFrom.value = undefined
  filterTo.value = undefined
}

function dateValueToISO(d: DateValue | undefined): string | undefined {
  if (!d) return undefined
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

function formatPickerDate(d: DateValue): string {
  const date = new Date(d.year, d.month - 1, d.day)
  return formatDate(date)
}

// Client-side filtering by type and category
const filteredRecords = computed(() => {
  let result = records.value
  if (filterType.value) {
    result = result.filter(r => r.type === filterType.value)
  }
  if (filterCategory.value) {
    result = result.filter(r => r.category === filterCategory.value)
  }
  return result
})

const formattedBalance = computed(() => {
  const num = parseFloat(balance.value)
  const prefix = num < 0 ? '- ' : ''
  return `${prefix}${formatCurrency(Math.abs(num))}`
})

function loadStatement() {
  fetchStatement({
    from: dateValueToISO(filterFrom.value),
    to: dateValueToISO(filterTo.value),
  })
}

watch([filterFrom, filterTo], () => loadStatement())

onMounted(() => {
  loadStatement()
})
</script>

<template>
  <div>
    <!-- Topbar filters -->
    <Teleport v-if="isMounted" :to="target" defer>
      <TopbarFilters :active="hasActiveFilters" @clear="clearAllFilters">
        <TopbarFilterGroup v-model="filterType" label="Tipo" :options="typeOptions" />
        <TopbarFilterGroup v-model="filterCategory" label="Categoría" :options="categoryOptions" />
        <div>
          <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Rango de fechas
          </p>
          <div class="space-y-1.5">
            <div>
              <Label class="text-[11px] text-muted-foreground">Desde</Label>
              <Popover v-model:open="fromPickerOpen">
                <PopoverTrigger as-child>
                  <Button variant="outline" class="mt-0.5 h-7 w-full justify-start text-xs font-normal">
                    <CalendarIcon class="mr-1.5 size-3 shrink-0 text-muted-foreground" />
                    <span v-if="filterFrom" class="truncate">{{ formatPickerDate(filterFrom) }}</span>
                    <span v-else class="text-muted-foreground">Seleccionar</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar
                    :model-value="filterFrom"
                    locale="es"
                    @update:model-value="(v: DateValue | undefined) => { filterFrom = v; fromPickerOpen = false }"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label class="text-[11px] text-muted-foreground">Hasta</Label>
              <Popover v-model:open="toPickerOpen">
                <PopoverTrigger as-child>
                  <Button variant="outline" class="mt-0.5 h-7 w-full justify-start text-xs font-normal">
                    <CalendarIcon class="mr-1.5 size-3 shrink-0 text-muted-foreground" />
                    <span v-if="filterTo" class="truncate">{{ formatPickerDate(filterTo) }}</span>
                    <span v-else class="text-muted-foreground">Seleccionar</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar
                    :model-value="filterTo"
                    locale="es"
                    @update:model-value="(v: DateValue | undefined) => { filterTo = v; toPickerOpen = false }"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </TopbarFilters>
    </Teleport>

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
      <!-- Balance Hero Card (always shows total balance, unaffected by filters) -->
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
        v-if="filteredRecords.length === 0"
        :icon="Wallet"
        title="Sin movimientos"
        :description="hasActiveFilters ? 'No hay movimientos que coincidan con los filtros seleccionados' : 'Tus cargos y pagos aparecerán aquí'"
        class="mt-4"
      />

      <div v-else class="mt-4 space-y-2">
        <p v-if="hasActiveFilters" class="text-xs text-muted-foreground">
          Mostrando {{ filteredRecords.length }} de {{ records.length }} movimientos
        </p>
        <Card v-for="record in filteredRecords" :key="record.id">
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
              <Badge variant="outline" class="h-4 px-1.5 text-[10px]">
                {{ record.category === 'ordinaria' ? 'Ord.' : 'Ext.' }}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
