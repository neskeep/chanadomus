<script setup lang="ts">
import {
  Wallet,
  Plus,
  Upload,
  FileText,
} from 'lucide-vue-next'

useHead({ title: 'Panel Financiero' })

const { summaries, isLoading, error, totalUnits, totalInDebt, fetchSummary } = useFinanceSummary()
const {
  reports,
  isLoading: reportsLoading,
  error: reportsError,
  totalPages,
  fetchReports,
} = useFinancialReports()

const { target, isMounted } = useTopbarPortal()

// --- Search & filters ---
const searchQuery = ref('')
const filterStatus = ref<'in_debt' | 'up_to_date' | ''>('')

const statusOptions = [
  { value: 'in_debt', label: 'En mora' },
  { value: 'up_to_date', label: 'Al dia' },
]

const filteredSummaries = computed(() => {
  let result = summaries.value

  if (filterStatus.value === 'in_debt') {
    result = result.filter(s => s.isInDebt)
  }
  else if (filterStatus.value === 'up_to_date') {
    result = result.filter(s => !s.isInDebt)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(
      s => s.unitNumber.toLowerCase().includes(q)
        || (s.unitLabel?.toLowerCase().includes(q)),
    )
  }

  // Deudores primero
  return [...result].sort((a, b) => parseFloat(a.balance) - parseFloat(b.balance))
})

// --- Table pagination (client-side) ---
const ITEMS_PER_PAGE = 15
const currentTablePage = ref(1)

const tableTotalPages = computed(() =>
  Math.max(1, Math.ceil(filteredSummaries.value.length / ITEMS_PER_PAGE)),
)

const paginatedSummaries = computed(() => {
  const start = (currentTablePage.value - 1) * ITEMS_PER_PAGE
  return filteredSummaries.value.slice(start, start + ITEMS_PER_PAGE)
})

// Reset to page 1 when filters change
watch([searchQuery, filterStatus], () => {
  currentTablePage.value = 1
})

// --- Reports pagination ---
const currentReportsPage = ref(1)

watch(currentReportsPage, (page) => {
  fetchReports(page)
})

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function getMonthLabel(month: number): string {
  return meses[month - 1] ?? ''
}

// --- Money formatting ---
const { formatCurrency } = useFormatDate()

function formatBalance(balance: string): string {
  const num = parseFloat(balance)
  const prefix = num < 0 ? '- ' : ''
  return `${prefix}${formatCurrency(Math.abs(num))}`
}

// --- Derived stats ---
const debtPercentage = computed(() => {
  if (!totalUnits.value) return 0
  return Math.round((totalInDebt.value / totalUnits.value) * 100)
})

// --- Init ---
onMounted(() => {
  fetchSummary()
  fetchReports(1)
})
</script>

<template>
  <div>
    <!-- Topbar actions -->
    <Teleport :to="target" defer v-if="isMounted">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar unidad...">
        <TopbarFilters :active="filterStatus !== ''" @clear="filterStatus = ''">
          <TopbarFilterGroup v-model="filterStatus" label="Estado" :options="statusOptions" />
        </TopbarFilters>
      </TopbarSearch>
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

    <!-- Error alert -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- 2-col layout: tabla + informes -->
    <div class="grid gap-6 lg:grid-cols-12">
      <!-- Tabla de saldos (principal) -->
      <section class="lg:col-span-7">
        <!-- Inline summary bar -->
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold">Estado de cuenta</h2>
          <p v-if="!isLoading" class="text-xs text-muted-foreground">
            <span class="tabular-nums font-medium text-foreground">{{ totalUnits }}</span> unidades
            <span class="mx-1 opacity-30">&middot;</span>
            <span class="tabular-nums font-medium text-destructive">{{ totalInDebt }}</span> en mora
            <span class="text-[11px]">({{ debtPercentage }}%)</span>
          </p>
        </div>

        <!-- Loading skeletons -->
        <ListSkeleton v-if="isLoading" :count="6" variant="row" />

        <!-- Empty state -->
        <EmptyState
          v-else-if="filteredSummaries.length === 0"
          :icon="Wallet"
          title="No se encontraron unidades"
          :description="searchQuery || filterStatus ? 'Intenta con otros filtros de busqueda' : 'No hay unidades registradas'"
        />

        <!-- Summary table -->
        <template v-else>
          <div class="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidad</TableHead>
                  <TableHead class="hidden sm:table-cell">Etiqueta</TableHead>
                  <TableHead class="text-right">Saldo</TableHead>
                  <TableHead class="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="summary in paginatedSummaries" :key="summary.unitId">
                  <TableCell class="font-medium">
                    {{ summary.unitNumber }}
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
                  <TableCell class="text-right">
                    <Badge :variant="summary.isInDebt ? 'destructive' : 'default'">
                      {{ summary.isInDebt ? 'En mora' : 'Al dia' }}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <ListPagination
            v-if="tableTotalPages > 1"
            v-model:current-page="currentTablePage"
            :total-pages="tableTotalPages"
            class="mt-3"
          />
        </template>
      </section>

      <!-- Informes financieros (lateral) -->
      <section class="lg:col-span-5">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold">Informes</h2>
          <Button variant="ghost" size="sm" as-child class="h-6 px-2 text-[11px] text-muted-foreground">
            <NuxtLink to="/admin/finanzas/subir-informe">
              <Upload class="mr-1 size-3" />
              Subir
            </NuxtLink>
          </Button>
        </div>

        <!-- Loading -->
        <ListSkeleton v-if="reportsLoading" :count="3" variant="row" />

        <!-- Error -->
        <ErrorAlert v-else-if="reportsError" :message="reportsError" />

        <!-- Empty state -->
        <EmptyState
          v-else-if="reports.length === 0"
          :icon="FileText"
          title="Sin informes"
          description="Los informes financieros apareceran aqui"
        />

        <!-- Report cards -->
        <div v-else class="space-y-2">
          <Card v-for="report in reports" :key="report.id">
            <CardContent class="flex items-center gap-3 px-3 py-2.5">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">
                  {{ report.title }}
                </p>
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

          <!-- Pagination -->
          <ListPagination v-model:current-page="currentReportsPage" :total-pages="totalPages" />
        </div>
      </section>
    </div>
  </div>
</template>
