<script setup lang="ts">
import {
  FileText,
  ArrowDownRight,
  ArrowUpRight,
  CalendarIcon,
  Pencil,
} from 'lucide-vue-next'
import type { DateValue } from 'reka-ui'

const route = useRoute()
const unitId = route.params.id as string

const { summaries, isLoading: summaryLoading, fetchSummary } = useFinanceSummary()
const { statement, isLoading: accountLoading, error: accountError, fetchAccount } = useUnitAccount()
const { formatCurrency, formatDate } = useFormatDate()
const { target, isMounted } = useTopbarPortal()

useHead({ title: 'Estado de Cuenta' })

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

// Find the selected unit from summaries
const selectedUnit = computed(() =>
  summaries.value.find(s => s.unitId === unitId) ?? null,
)

// Client-side filtering by type and category
const filteredRecords = computed(() => {
  if (!statement.value) return []
  let result = statement.value.records
  if (filterType.value) {
    result = result.filter(r => r.type === filterType.value)
  }
  if (filterCategory.value) {
    result = result.filter(r => r.category === filterCategory.value)
  }
  return result
})

function formatBalance(balance: string): string {
  const num = parseFloat(balance)
  const prefix = num < 0 ? '- ' : ''
  return `${prefix}${formatCurrency(Math.abs(num))}`
}

function loadAccount() {
  fetchAccount(unitId, {
    from: dateValueToISO(filterFrom.value),
    to: dateValueToISO(filterTo.value),
  })
}

watch([filterFrom, filterTo], () => loadAccount())

onMounted(async () => {
  await fetchSummary()
  loadAccount()
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
            v-else-if="filteredRecords.length === 0"
            :icon="FileText"
            title="Sin movimientos"
            :description="hasActiveFilters ? 'No hay movimientos que coincidan con los filtros seleccionados' : 'No hay movimientos registrados para esta unidad'"
          />

          <!-- Records -->
          <template v-else>
            <!-- Desktop table -->
            <div class="hidden overflow-x-auto rounded-lg border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead class="text-right">Monto</TableHead>
                    <TableHead class="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="record in filteredRecords" :key="record.id">
                    <TableCell class="tabular-nums text-muted-foreground">
                      {{ formatDate(record.date) }}
                    </TableCell>
                    <TableCell class="max-w-[300px] truncate font-medium">
                      {{ record.description }}
                    </TableCell>
                    <TableCell>
                      <Badge
                        :variant="record.type === 'cargo' ? 'destructive' : 'default'"
                        class="text-[11px]"
                      >
                        <ArrowDownRight v-if="record.type === 'cargo'" class="mr-0.5 size-3" />
                        <ArrowUpRight v-else class="mr-0.5 size-3" />
                        {{ record.type === 'cargo' ? 'Cargo' : 'Abono' }}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" class="text-[11px]">
                        {{ record.category === 'ordinaria' ? 'Ordinaria' : 'Extraordinaria' }}
                      </Badge>
                    </TableCell>
                    <TableCell
                      class="text-right font-semibold tabular-nums"
                      :class="record.type === 'cargo' ? 'text-destructive' : 'text-primary'"
                    >
                      {{ record.type === 'cargo' ? '- ' : '+ ' }}{{ formatCurrency(parseFloat(record.amount)) }}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-7"
                        as-child
                      >
                        <NuxtLink :to="`/admin/finanzas/editar/${record.id}`">
                          <Pencil class="size-3.5 text-muted-foreground" />
                        </NuxtLink>
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <!-- Mobile cards -->
            <div class="space-y-2 md:hidden">
              <Card v-for="record in filteredRecords" :key="record.id">
                <NuxtLink :to="`/admin/finanzas/editar/${record.id}`" class="block">
                  <CardContent class="px-3 py-2.5">
                    <div class="flex items-start justify-between gap-2">
                      <p class="min-w-0 flex-1 truncate text-sm font-medium">{{ record.description }}</p>
                      <div class="flex shrink-0 items-center gap-1.5">
                        <span
                          class="text-sm font-semibold tabular-nums"
                          :class="record.type === 'cargo' ? 'text-destructive' : 'text-primary'"
                        >
                          {{ record.type === 'cargo' ? '-' : '+' }} {{ formatCurrency(parseFloat(record.amount)) }}
                        </span>
                        <Pencil class="size-3 text-muted-foreground/50" />
                      </div>
                    </div>
                    <div class="mt-1 flex items-center justify-between">
                      <span class="text-[11px] tabular-nums text-muted-foreground">{{ formatDate(record.date) }}</span>
                      <div class="flex items-center gap-1">
                        <Badge
                          :variant="record.type === 'cargo' ? 'destructive' : 'default'"
                          class="h-4 px-1.5 text-[10px]"
                        >
                          {{ record.type === 'cargo' ? 'Cargo' : 'Abono' }}
                        </Badge>
                        <Badge variant="outline" class="h-4 px-1.5 text-[10px]">
                          {{ record.category === 'ordinaria' ? 'Ord.' : 'Ext.' }}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </NuxtLink>
              </Card>
            </div>
          </template>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
