<script setup lang="ts">
import {
  Wallet,
  Plus,
  Upload,
  Download,
  FileText,
  CalendarIcon,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Home,
  Trash2,
  X,
  Layers,
  DollarSign,
  RefreshCw,
  Tag,
} from 'lucide-vue-next'
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import { toast } from 'vue-sonner'

useHead({ title: 'Panel Financiero' })

const { summaries, totals, isLoading: summaryLoading, totalUnits, totalRanchos, totalParcelas, totalInDebt, fetchSummary } = useFinanceSummary()
const { movements, isLoading: movementsLoading, error: movementsError, totalPages, fetchMovements } = useFinanceMovements()
const {
  reports,
  isLoading: reportsLoading,
  error: reportsError,
  totalPages: reportsTotalPages,
  fetchReports,
} = useFinancialReports()

const { target, isMounted } = useTopbarPortal()
const { formatCurrency, formatDate } = useFormatDate()
const router = useRouter()

// --- Filters ---
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

const filterCategory = ref<'ordinaria' | 'extraordinaria' | ''>('')

const hasActiveFilters = computed(() =>
  filterFrom.value !== undefined || filterTo.value !== undefined || filterType.value !== '' || filterCategory.value !== '',
)

function clearAllFilters() {
  filterFrom.value = undefined
  filterTo.value = undefined
  filterType.value = ''
  filterCategory.value = ''
}

function dateValueToISO(d: DateValue | undefined): string | undefined {
  if (!d) return undefined
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

function formatPickerDate(d: DateValue): string {
  const date = new Date(d.year, d.month - 1, d.day)
  return formatDate(date)
}

// --- Tabs ---
const activeTab = ref<'movements' | 'balances' | 'reports'>('movements')

// --- Movements pagination & filter ---
const currentPage = ref(1)
const filterType = ref<'cargo' | 'abono' | ''>('')

function loadMovements() {
  fetchMovements({
    page: currentPage.value,
    from: dateValueToISO(filterFrom.value),
    to: dateValueToISO(filterTo.value),
    type: filterType.value || undefined,
    category: filterCategory.value || undefined,
  })
}

watch([currentPage], () => loadMovements())
watch(filterType, () => {
  currentPage.value = 1
  loadMovements()
})
watch(filterCategory, () => {
  currentPage.value = 1
  loadMovements()
})
watch([filterFrom, filterTo], () => {
  currentPage.value = 1
  loadMovements()
  fetchSummary({
    from: dateValueToISO(filterFrom.value),
    to: dateValueToISO(filterTo.value),
  })
})

// --- Balances table (client-side pagination) ---
const ITEMS_PER_PAGE = 15
const currentBalancePage = ref(1)
const balanceSearch = ref('')

const filteredSummaries = computed(() => {
  let result = summaries.value
  if (balanceSearch.value.trim()) {
    const q = balanceSearch.value.trim().toLowerCase()
    result = result.filter(
      s => s.unitNumber.toLowerCase().includes(q)
        || (s.unitLabel?.toLowerCase().includes(q)),
    )
  }
  return [...result].sort((a, b) => parseFloat(a.balance) - parseFloat(b.balance))
})

const balanceTotalPages = computed(() =>
  Math.max(1, Math.ceil(filteredSummaries.value.length / ITEMS_PER_PAGE)),
)

const paginatedSummaries = computed(() => {
  const start = (currentBalancePage.value - 1) * ITEMS_PER_PAGE
  return filteredSummaries.value.slice(start, start + ITEMS_PER_PAGE)
})

watch(balanceSearch, () => { currentBalancePage.value = 1 })

// --- Reports pagination ---
const currentReportsPage = ref(1)
watch(currentReportsPage, (page) => fetchReports(page))

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
function getMonthLabel(month: number): string {
  return meses[month - 1] ?? ''
}

// --- Stats (from server aggregates) ---

function formatBalance(balance: string): string {
  const num = parseFloat(balance)
  const prefix = num < 0 ? '- ' : ''
  return `${prefix}${formatCurrency(Math.abs(num))}`
}

// --- Date presets ---
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

const datePresets = computed(() => {
  const t = today(getLocalTimeZone())
  const quarter = Math.floor((t.month - 1) / 3)
  const quarterStart = quarter * 3 + 1
  return [
    {
      label: 'Este mes',
      from: new CalendarDate(t.year, t.month, 1),
      to: new CalendarDate(t.year, t.month, getLastDayOfMonth(t.year, t.month)),
    },
    {
      label: 'Mes pasado',
      from: t.month === 1
        ? new CalendarDate(t.year - 1, 12, 1)
        : new CalendarDate(t.year, t.month - 1, 1),
      to: t.month === 1
        ? new CalendarDate(t.year - 1, 12, 31)
        : new CalendarDate(t.year, t.month - 1, getLastDayOfMonth(t.year, t.month - 1)),
    },
    {
      label: 'Trimestre',
      from: new CalendarDate(t.year, quarterStart, 1),
      to: t,
    },
    {
      label: 'Este año',
      from: new CalendarDate(t.year, 1, 1),
      to: t,
    },
  ]
})

function applyPreset(preset: { from: DateValue; to: DateValue }) {
  filterFrom.value = preset.from
  filterTo.value = preset.to
}

function isActivePreset(preset: { from: DateValue; to: DateValue }): boolean {
  if (!filterFrom.value || !filterTo.value) return false
  return filterFrom.value.year === preset.from.year
    && filterFrom.value.month === preset.from.month
    && filterFrom.value.day === preset.from.day
    && filterTo.value.year === preset.to.year
    && filterTo.value.month === preset.to.month
    && filterTo.value.day === preset.to.day
}

// --- CSV export ---
function handleExport() {
  const params = new URLSearchParams()
  const from = dateValueToISO(filterFrom.value)
  const to = dateValueToISO(filterTo.value)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  if (filterType.value) params.set('type', filterType.value)
  if (filterCategory.value) params.set('category', filterCategory.value)
  window.open(`/api/finance/export?${params.toString()}`, '_blank')
}

// --- Bulk selection ---
const selectedIds = ref<string[]>([])
const { isSubmitting: bulkSubmitting, bulkUpdate, bulkDelete } = useFinanceBulk()

const isAllPageSelected = computed(() =>
  movements.value.length > 0 && movements.value.every(m => selectedIds.value.includes(m.id)),
)

function toggleSelectAll() {
  if (isAllPageSelected.value) {
    const pageIds = new Set(movements.value.map(m => m.id))
    selectedIds.value = selectedIds.value.filter(id => !pageIds.has(id))
  }
  else {
    const existing = new Set(selectedIds.value)
    const newIds = movements.value.filter(m => !existing.has(m.id)).map(m => m.id)
    selectedIds.value = [...selectedIds.value, ...newIds]
  }
}

function toggleSelect(id: string) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(v => v !== id)
  }
  else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

function clearSelection() {
  selectedIds.value = []
}

watch([currentPage, filterType, filterCategory, filterFrom, filterTo], () => {
  clearSelection()
})

const bulkDatePickerOpen = ref(false)
const bulkAmountInput = ref('')
const bulkAmountPopoverOpen = ref(false)

async function handleBulkDateChange(v: DateValue | undefined) {
  if (!v) return
  bulkDatePickerOpen.value = false
  try {
    const dateStr = dateValueToISO(v)!
    await bulkUpdate(selectedIds.value, { date: dateStr })
    toast.success(`Fecha actualizada en ${selectedIds.value.length} registros`)
    clearSelection()
    loadMovements()
  }
  catch {
    toast.error('Error al actualizar fecha')
  }
}

async function handleBulkTypeChange(type: 'cargo' | 'abono') {
  try {
    await bulkUpdate(selectedIds.value, { type })
    toast.success(`Tipo cambiado a "${type === 'cargo' ? 'Cargo' : 'Abono'}" en ${selectedIds.value.length} registros`)
    clearSelection()
    loadMovements()
    fetchSummary({ from: dateValueToISO(filterFrom.value), to: dateValueToISO(filterTo.value) })
  }
  catch {
    toast.error('Error al cambiar tipo')
  }
}

async function handleBulkCategoryChange(category: 'ordinaria' | 'extraordinaria') {
  try {
    await bulkUpdate(selectedIds.value, { category })
    toast.success(`Categoría cambiada a "${category === 'ordinaria' ? 'Ordinaria' : 'Extraordinaria'}" en ${selectedIds.value.length} registros`)
    clearSelection()
    loadMovements()
  }
  catch {
    toast.error('Error al cambiar categoría')
  }
}

async function handleBulkAmountChange() {
  const amount = parseFloat(bulkAmountInput.value)
  if (isNaN(amount) || amount <= 0) {
    toast.error('Ingresa un monto válido mayor a 0')
    return
  }
  bulkAmountPopoverOpen.value = false
  try {
    await bulkUpdate(selectedIds.value, { amount })
    toast.success(`Monto actualizado a ${formatCurrency(amount)} en ${selectedIds.value.length} registros`)
    bulkAmountInput.value = ''
    clearSelection()
    loadMovements()
    fetchSummary({ from: dateValueToISO(filterFrom.value), to: dateValueToISO(filterTo.value) })
  }
  catch {
    toast.error('Error al cambiar monto')
  }
}

async function handleBulkDelete() {
  try {
    const result = await bulkDelete(selectedIds.value)
    toast.success(`${result.deleted} registros eliminados`)
    clearSelection()
    loadMovements()
    fetchSummary({ from: dateValueToISO(filterFrom.value), to: dateValueToISO(filterTo.value) })
  }
  catch {
    toast.error('Error al eliminar registros')
  }
}

// --- Init ---
onMounted(() => {
  fetchSummary()
  loadMovements()
  fetchReports(1)
})
</script>

<template>
  <div>
    <!-- Topbar actions -->
    <Teleport v-if="isMounted" :to="target" defer>
      <TopbarFilters :active="hasActiveFilters" @clear="clearAllFilters">
        <TopbarFilterGroup v-model="filterType" label="Tipo" :options="typeOptions" />
        <TopbarFilterGroup v-model="filterCategory" label="Categoría" :options="categoryOptions" />
        <div>
          <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Periodo rápido
          </p>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="preset in datePresets"
              :key="preset.label"
              class="rounded-md px-2 py-1 text-xs font-medium transition-colors"
              :class="isActivePreset(preset) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>
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
      <Button variant="outline" size="sm" @click="handleExport">
        <Download class="mr-1.5 size-4" />
        Exportar
      </Button>
      <Button variant="outline" size="sm" as-child>
        <NuxtLink to="/admin/finanzas/subir-informe">
          <Upload class="mr-1.5 size-4" />
          Informe
        </NuxtLink>
      </Button>
      <Button variant="outline" size="sm" as-child>
        <NuxtLink to="/admin/finanzas/generar-cuotas">
          <Layers class="mr-1.5 size-4" />
          Generar cuotas
        </NuxtLink>
      </Button>
      <Button size="sm" as-child>
        <NuxtLink to="/admin/finanzas/registrar">
          <Plus class="mr-1.5 size-4" />
          Registrar
        </NuxtLink>
      </Button>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" as-child>
        <NuxtLink to="/admin/finanzas/registrar">
          <Plus class="size-4" />
        </NuxtLink>
      </Button>
    </TopbarMobileAction>

    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Total cobrado"
        :value="formatCurrency(totals.totalCobrado)"
        :icon="Wallet"
        icon-bg-class="bg-primary/10 text-primary"
        tooltip="Suma de todos los pagos (abonos) recibidos"
        :is-loading="summaryLoading"
      />
      <StatCard
        label="Pendiente"
        :value="formatCurrency(totals.pendiente)"
        :icon="AlertTriangle"
        icon-bg-class="bg-destructive/10 text-destructive"
        tooltip="Saldo total pendiente de cobro: cargos menos abonos"
        :is-loading="summaryLoading"
      />
      <Card class="p-3 sm:p-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary sm:order-2 sm:size-10">
            <Home class="size-3.5 sm:size-5" />
          </div>
          <div class="flex min-w-0 flex-col gap-0.5 sm:order-1 sm:gap-1">
            <template v-if="summaryLoading">
              <Skeleton class="h-4 w-12 sm:h-5 sm:w-16" />
              <Skeleton class="h-6 w-10 sm:h-8 sm:w-24" />
            </template>
            <template v-else>
              <p class="text-[11px] leading-tight text-muted-foreground sm:text-sm">Unidades</p>
              <p class="text-lg font-bold tabular-nums tracking-tight sm:text-2xl">{{ totalUnits }}</p>
              <p class="text-[11px] text-muted-foreground sm:text-xs">{{ totalRanchos }} Ranchos · {{ totalParcelas }} Parcelas</p>
            </template>
          </div>
        </div>
      </Card>
      <StatCard
        label="En mora"
        :value="totalInDebt"
        :icon="AlertTriangle"
        icon-bg-class="bg-destructive/10 text-destructive"
        tooltip="Unidades con saldo pendiente de pago"
        :is-loading="summaryLoading"
      />
    </div>

    <!-- Tabs -->
    <div class="mb-3 flex items-center justify-between border-b">
      <div class="flex items-center gap-1">
        <button
          class="px-3 py-2 text-sm font-medium transition-colors"
          :class="activeTab === 'movements'
            ? 'border-b-2 border-primary text-foreground'
            : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'movements'"
        >
          Movimientos
        </button>
        <button
          class="px-3 py-2 text-sm font-medium transition-colors"
          :class="activeTab === 'balances'
            ? 'border-b-2 border-primary text-foreground'
            : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'balances'"
        >
          Saldos por unidad
        </button>
        <button
          class="px-3 py-2 text-sm font-medium transition-colors"
          :class="activeTab === 'reports'
            ? 'border-b-2 border-primary text-foreground'
            : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'reports'"
        >
          Informes
        </button>
      </div>
      <Input
        v-if="activeTab === 'balances'"
        v-model="balanceSearch"
        placeholder="Buscar unidad..."
        class="mb-1 h-7 w-40 text-xs"
      />
    </div>

    <section class="min-w-0">

        <!-- Tab: Movimientos -->
        <template v-if="activeTab === 'movements'">
          <ErrorAlert v-if="movementsError" :message="movementsError" class="mb-4" />

          <ListSkeleton v-if="movementsLoading" :count="6" variant="row" />

          <EmptyState
            v-else-if="movements.length === 0"
            :icon="Wallet"
            title="Sin movimientos"
            :description="hasActiveFilters ? 'Prueba con otro rango de fechas' : 'Los movimientos registrados aparecerán aquí'"
          />

          <template v-else>
            <!-- Desktop table -->
            <div class="hidden overflow-x-auto rounded-lg border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="w-10" @click.stop>
                      <Checkbox :model-value="isAllPageSelected" @update:model-value="toggleSelectAll" />
                    </TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead class="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="mov in movements"
                    :key="mov.id"
                    class="cursor-pointer transition-colors hover:bg-muted/50"
                    @click="router.push(`/admin/finanzas/${mov.unitId}`)"
                  >
                    <TableCell class="w-10" @click.stop>
                      <Checkbox :model-value="selectedIds.includes(mov.id)" @update:model-value="toggleSelect(mov.id)" />
                    </TableCell>
                    <TableCell class="tabular-nums text-muted-foreground">
                      {{ formatDate(mov.date) }}
                    </TableCell>
                    <TableCell class="font-medium">
                      {{ mov.unitLabel || mov.unitNumber }}
                    </TableCell>
                    <TableCell class="max-w-[200px] truncate">
                      {{ mov.description }}
                    </TableCell>
                    <TableCell>
                      <Badge
                        :variant="mov.type === 'cargo' ? 'destructive' : 'default'"
                        class="text-[11px]"
                      >
                        <ArrowDownRight v-if="mov.type === 'cargo'" class="mr-0.5 size-3" />
                        <ArrowUpRight v-else class="mr-0.5 size-3" />
                        {{ mov.type === 'cargo' ? 'Cargo' : 'Abono' }}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" class="text-[11px]">
                        {{ mov.category === 'ordinaria' ? 'Ordinaria' : 'Extraordinaria' }}
                      </Badge>
                    </TableCell>
                    <TableCell
                      class="text-right font-semibold tabular-nums"
                      :class="mov.type === 'cargo' ? 'text-destructive' : 'text-primary'"
                    >
                      {{ mov.type === 'cargo' ? '- ' : '+ ' }}{{ formatCurrency(parseFloat(mov.amount)) }}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <!-- Mobile cards -->
            <div class="space-y-2 overflow-hidden md:hidden">
              <Card
                v-for="mov in movements"
                :key="mov.id"
                class="cursor-pointer overflow-hidden transition-colors hover:bg-muted/50"
                @click="router.push(`/admin/finanzas/${mov.unitId}`)"
              >
                <CardContent class="px-3 py-2.5">
                  <div class="flex items-start justify-between gap-2">
                    <p class="min-w-0 truncate text-sm font-medium">{{ mov.description }}</p>
                    <span
                      class="shrink-0 text-sm font-semibold tabular-nums"
                      :class="mov.type === 'cargo' ? 'text-destructive' : 'text-primary'"
                    >
                      {{ mov.type === 'cargo' ? '-' : '+' }} {{ formatCurrency(parseFloat(mov.amount)) }}
                    </span>
                  </div>
                  <div class="mt-1 flex items-center justify-between">
                    <div class="flex min-w-0 items-center gap-x-1.5 text-[11px] text-muted-foreground">
                      <span class="truncate font-medium">{{ mov.unitLabel || mov.unitNumber }}</span>
                      <span class="shrink-0 opacity-30">&middot;</span>
                      <span class="shrink-0 tabular-nums">{{ formatDate(mov.date) }}</span>
                    </div>
                    <div class="flex shrink-0 items-center gap-1">
                      <Badge
                        :variant="mov.type === 'cargo' ? 'destructive' : 'default'"
                        class="h-4 px-1.5 text-[10px]"
                      >
                        {{ mov.type === 'cargo' ? 'Cargo' : 'Abono' }}
                      </Badge>
                      <Badge variant="outline" class="h-4 px-1.5 text-[10px]">
                        {{ mov.category === 'ordinaria' ? 'Ord.' : 'Ext.' }}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <ListPagination v-model:current-page="currentPage" :total-pages="totalPages" class="mt-3" />

            <!-- Bulk action bar (teleported to body to escape overflow-hidden ancestors) -->
            <Teleport to="body">
              <div
                v-if="selectedIds.length > 0"
                class="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
              >
                <div class="mx-auto flex max-w-screen-xl items-center justify-between gap-3">
                  <span class="text-sm font-medium">{{ selectedIds.length }} seleccionados</span>
                  <div class="flex flex-wrap items-center gap-2">
                    <!-- Cambiar tipo -->
                    <Popover>
                      <PopoverTrigger as-child>
                        <Button variant="outline" size="sm" :disabled="bulkSubmitting">
                          <RefreshCw class="mr-1.5 size-4" />
                          Tipo
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-40 p-1" align="end" side="top">
                        <button
                          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                          @click="handleBulkTypeChange('cargo')"
                        >
                          <ArrowDownRight class="size-4 text-destructive" />
                          Cargo
                        </button>
                        <button
                          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                          @click="handleBulkTypeChange('abono')"
                        >
                          <ArrowUpRight class="size-4 text-primary" />
                          Abono
                        </button>
                      </PopoverContent>
                    </Popover>

                    <!-- Cambiar categoría -->
                    <Popover>
                      <PopoverTrigger as-child>
                        <Button variant="outline" size="sm" :disabled="bulkSubmitting">
                          <Tag class="mr-1.5 size-4" />
                          Categoría
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-44 p-1" align="end" side="top">
                        <button
                          class="flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                          @click="handleBulkCategoryChange('ordinaria')"
                        >
                          Ordinaria
                        </button>
                        <button
                          class="flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                          @click="handleBulkCategoryChange('extraordinaria')"
                        >
                          Extraordinaria
                        </button>
                      </PopoverContent>
                    </Popover>

                    <!-- Cambiar monto -->
                    <Popover v-model:open="bulkAmountPopoverOpen">
                      <PopoverTrigger as-child>
                        <Button variant="outline" size="sm" :disabled="bulkSubmitting">
                          <DollarSign class="mr-1.5 size-4" />
                          Monto
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-52 p-3" align="end" side="top">
                        <p class="mb-2 text-xs font-medium text-muted-foreground">Nuevo monto para los {{ selectedIds.length }} registros</p>
                        <div class="flex gap-2">
                          <Input
                            v-model="bulkAmountInput"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            class="h-8 text-sm"
                            @keydown.enter="handleBulkAmountChange"
                          />
                          <Button size="sm" class="h-8 shrink-0" :disabled="bulkSubmitting" @click="handleBulkAmountChange">
                            Aplicar
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <!-- Cambiar fecha -->
                    <Popover v-model:open="bulkDatePickerOpen">
                      <PopoverTrigger as-child>
                        <Button variant="outline" size="sm" :disabled="bulkSubmitting">
                          <CalendarIcon class="mr-1.5 size-4" />
                          Fecha
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-auto p-0" align="end" side="top">
                        <Calendar locale="es" @update:model-value="handleBulkDateChange" />
                      </PopoverContent>
                    </Popover>

                    <!-- Eliminar -->
                    <AlertDialog>
                      <AlertDialogTrigger as-child>
                        <Button variant="destructive" size="sm" :disabled="bulkSubmitting">
                          <Trash2 class="mr-1.5 size-4" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar {{ selectedIds.length }} registros?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" @click="handleBulkDelete">
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <!-- Cancelar selección -->
                    <Button variant="ghost" size="sm" @click="clearSelection">
                      <X class="mr-1.5 size-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </Teleport>
          </template>
        </template>

        <!-- Tab: Saldos por unidad -->
        <template v-if="activeTab === 'balances'">
          <ListSkeleton v-if="summaryLoading" :count="6" variant="row" />

          <EmptyState
            v-else-if="filteredSummaries.length === 0"
            :icon="Wallet"
            title="No se encontraron unidades"
            :description="balanceSearch ? 'Intenta con otra búsqueda' : 'No hay unidades registradas'"
          />

          <template v-else>
            <div class="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidad</TableHead>
                    <TableHead class="hidden sm:table-cell">Etiqueta</TableHead>
                    <TableHead class="text-right">Saldo</TableHead>
                    <TableHead class="hidden sm:table-cell">Último mov.</TableHead>
                    <TableHead class="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="summary in paginatedSummaries"
                    :key="summary.unitId"
                    class="cursor-pointer transition-colors hover:bg-muted/50"
                    @click="router.push(`/admin/finanzas/${summary.unitId}`)"
                  >
                    <TableCell class="font-medium">
                      {{ summary.unitLabel || summary.unitNumber }}
                    </TableCell>
                    <TableCell class="hidden text-muted-foreground sm:table-cell">
                      {{ summary.unitLabel ?? '—' }}
                    </TableCell>
                    <TableCell
                      class="text-right font-semibold tabular-nums"
                      :class="summary.isInDebt ? 'text-destructive' : 'text-primary'"
                    >
                      {{ formatBalance(summary.balance) }}
                    </TableCell>
                    <TableCell class="hidden tabular-nums text-muted-foreground sm:table-cell">
                      {{ summary.lastMovementDate ? formatDate(summary.lastMovementDate) : '—' }}
                    </TableCell>
                    <TableCell class="text-right">
                      <Badge :variant="summary.isInDebt ? 'destructive' : 'default'">
                        {{ summary.isInDebt ? 'En mora' : 'Al día' }}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <ListPagination
              v-if="balanceTotalPages > 1"
              v-model:current-page="currentBalancePage"
              :total-pages="balanceTotalPages"
              class="mt-3"
            />
          </template>
        </template>

        <!-- Tab: Informes -->
        <template v-if="activeTab === 'reports'">
          <ListSkeleton v-if="reportsLoading" :count="3" variant="row" />

          <ErrorAlert v-else-if="reportsError" :message="reportsError" />

          <EmptyState
            v-else-if="reports.length === 0"
            :icon="FileText"
            title="Sin informes"
            description="Los informes financieros aparecerán aquí"
          />

          <template v-else>
            <!-- Desktop table -->
            <div class="hidden overflow-x-auto rounded-lg border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead class="w-[100px] text-right">Archivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="report in reports" :key="report.id">
                    <TableCell class="font-medium">
                      {{ report.title }}
                    </TableCell>
                    <TableCell class="text-muted-foreground">
                      {{ getMonthLabel(report.month) }} {{ report.year }}
                    </TableCell>
                    <TableCell class="text-right">
                      <Button
                        variant="ghost"
                        class="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                        as="a"
                        :href="`/api/finance/reports/${report.filePath}`"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText class="size-3" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <!-- Mobile cards -->
            <div class="space-y-2 md:hidden">
              <Card v-for="report in reports" :key="report.id">
                <CardContent class="flex items-center gap-3 px-3 py-2.5">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold">{{ report.title }}</p>
                    <p class="mt-0.5 text-[11px] text-muted-foreground">
                      {{ getMonthLabel(report.month) }} {{ report.year }}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    class="h-6 shrink-0 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    as="a"
                    :href="`/api/finance/reports/${report.filePath}`"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText class="size-3" />
                    PDF
                  </Button>
                </CardContent>
              </Card>
            </div>

            <ListPagination v-model:current-page="currentReportsPage" :total-pages="reportsTotalPages" class="mt-3" />
          </template>
        </template>
      </section>
  </div>
</template>
