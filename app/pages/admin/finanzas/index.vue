<script setup lang="ts">
import {
  Wallet,
  Plus,
  Upload,
  FileText,
  CalendarIcon,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Home,
} from 'lucide-vue-next'
import type { DateValue } from 'reka-ui'

useHead({ title: 'Panel Financiero' })

const { summaries, isLoading: summaryLoading, totalUnits, totalRanchos, totalParcelas, totalInDebt, fetchSummary } = useFinanceSummary()
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
const activeTab = ref<'movements' | 'balances'>('movements')

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

// --- Stats ---
const totalCollected = computed(() => {
  return summaries.value.reduce((sum, s) => {
    const b = parseFloat(s.balance)
    return b > 0 ? sum + b : sum
  }, 0)
})

const totalDebt = computed(() => {
  return summaries.value.reduce((sum, s) => {
    const b = parseFloat(s.balance)
    return b < 0 ? sum + Math.abs(b) : sum
  }, 0)
})

function formatBalance(balance: string): string {
  const num = parseFloat(balance)
  const prefix = num < 0 ? '- ' : ''
  return `${prefix}${formatCurrency(Math.abs(num))}`
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
      <Button variant="outline" size="sm" as-child>
        <NuxtLink to="/admin/finanzas/subir-informe">
          <Upload class="mr-1.5 size-4" />
          Subir informe
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
        label="Total recaudado"
        :value="formatCurrency(totalCollected)"
        :icon="Wallet"
        icon-bg-class="bg-primary/10 text-primary"
        :is-loading="summaryLoading"
      />
      <StatCard
        label="Total adeudado"
        :value="formatCurrency(totalDebt)"
        :icon="AlertTriangle"
        icon-bg-class="bg-destructive/10 text-destructive"
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
        :is-loading="summaryLoading"
      />
    </div>

    <!-- 2-col layout: main + reports sidebar -->
    <div class="grid gap-6 lg:grid-cols-12">
      <!-- Main content -->
      <section class="min-w-0 lg:col-span-7">
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
          </div>
          <Input
            v-if="activeTab === 'balances'"
            v-model="balanceSearch"
            placeholder="Buscar unidad..."
            class="mb-1 h-7 w-40 text-xs"
          />
        </div>

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
      </section>

      <!-- Reports sidebar -->
      <section class="min-w-0 lg:col-span-5">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold">Informes</h2>
          <Button variant="ghost" size="sm" as-child class="h-6 px-2 text-[11px] text-muted-foreground">
            <NuxtLink to="/admin/finanzas/subir-informe">
              <Upload class="mr-1 size-3" />
              Subir
            </NuxtLink>
          </Button>
        </div>

        <ListSkeleton v-if="reportsLoading" :count="3" variant="row" />

        <ErrorAlert v-else-if="reportsError" :message="reportsError" />

        <EmptyState
          v-else-if="reports.length === 0"
          :icon="FileText"
          title="Sin informes"
          description="Los informes financieros aparecerán aquí"
        />

        <div v-else class="space-y-2">
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

          <ListPagination v-model:current-page="currentReportsPage" :total-pages="reportsTotalPages" />
        </div>
      </section>
    </div>
  </div>
</template>
