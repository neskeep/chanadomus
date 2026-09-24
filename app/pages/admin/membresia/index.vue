<script setup lang="ts">
import { CalendarCheck, ChevronRight, Download, Lock, Receipt, Search, Tags, Building2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useDebounceFn } from '@vueuse/core'
import {
  MEMBERSHIP_TIERS,
  MEMBERSHIP_UNIT_KINDS,
  MEMBERSHIP_UNIT_KIND_LABELS,
  type MembershipClosing,
} from '~~/shared/types/membership'

useHead({ title: 'Membresía' })

// --- Pestañas (sincronizadas con ?tab=) ---

type PageTab = 'en-curso' | 'cierres'

const route = useRoute()
const router = useRouter()

const activeTab = computed<PageTab>({
  get: () => (route.query.tab === 'cierres' ? 'cierres' : 'en-curso'),
  set: (tab) => {
    router.replace({ query: { ...route.query, tab: tab === 'cierres' ? 'cierres' : undefined } })
  },
})

function onTabChange(value: string | number) {
  activeTab.value = value === 'cierres' ? 'cierres' : 'en-curso'
}

// --- Mes en curso ---

const {
  summary,
  rows,
  meta,
  filters,
  totalPages,
  activeFilterCount,
  hasFilters,
  isLoadingUnits,
  hasFetchedUnits,
  summaryError,
  unitsError,
  fetchSummary,
  fetchUnits,
  setFilters,
  setPage,
  clearFilters,
} = useMembership()

const { formatDate, formatDateTime, formatMonthYear, formatCurrency } = useFormatDate()

const isSummaryPending = computed(() => !summary.value && !summaryError.value)
const isSuperAdmin = computed(() => summary.value?.isSuperAdmin === true)
const monthName = (period: string) => formatMonthYear(`${period}-01`)

const tierOptions = [
  { value: 'full', label: 'Completa' },
  { value: 'reduced', label: 'Reducida' },
]
const kindOptions = MEMBERSHIP_UNIT_KINDS.map(kind => ({ value: kind, label: MEMBERSHIP_UNIT_KIND_LABELS[kind] }))
const activeOptions = [
  { value: 'true', label: 'Activas' },
  { value: 'false', label: 'Inactivas' },
]

// TopbarFilterGroup trabaja con string ('' = sin filtro); el composable con valores tipados o null.
const tierFilter = computed({
  get: () => filters.tier ?? '',
  set: (value: string) => setFilters({ tier: MEMBERSHIP_TIERS.find(t => t === value) ?? null }),
})
const kindFilter = computed({
  get: () => filters.kind ?? '',
  set: (value: string) => setFilters({ kind: MEMBERSHIP_UNIT_KINDS.find(k => k === value) ?? null }),
})
const activeFilter = computed({
  get: () => (filters.active === null ? '' : String(filters.active)),
  set: (value: string) => setFilters({ active: value === '' ? null : value === 'true' }),
})

const debouncedSearch = useDebounceFn(() => setFilters({}), 300)
const searchQuery = computed({
  get: () => filters.search,
  set: (value: string) => {
    filters.search = value
    debouncedSearch()
  },
})

const rateNote = computed(() => {
  const s = summary.value
  if (!s?.rate) return null
  const from = formatDate(s.rate.effectiveFrom)
  return s.rateStatus === 'upcoming'
    ? { upcoming: true, text: `Estas tarifas rigen desde el ${from}. Hasta entonces, el cálculo sirve como vista previa y no se cobra.` }
    : { upcoming: false, text: `Tarifa vigente desde el ${from}.` }
})

const demoNote = computed(() => {
  const n = summary.value?.excludedDemoUnits ?? 0
  if (n === 0) return null
  return n === 1 ? 'No incluye 1 unidad DEMO.' : `No incluye ${n} unidades DEMO.`
})

const unitsEmpty = computed(() => hasFilters.value
  ? { icon: Search, title: 'Sin resultados', description: 'Prueba con otro número o nombre de unidad, o limpia los filtros.' }
  : { icon: Building2, title: 'No hay unidades para cobrar', description: 'Cuando registres unidades en Unidades aparecerán aquí con su tarifa.' },
)

// --- Cierres ---

const {
  closings,
  isLoading: isLoadingClosings,
  hasFetched: hasFetchedClosings,
  isClosing,
  error: closingsError,
  fetchClosings,
  closePeriod,
} = useMembershipClosings()

function closingAuthor(closing: MembershipClosing): string {
  if (closing.isAutomatic) return 'Cierre automático'
  return closing.closedByName ? `Cerrado por ${closing.closedByName}` : 'Cierre manual'
}

function tierCountText(closing: MembershipClosing): string {
  return `${closing.unitsFull} a tarifa completa, ${closing.unitsReduced} a reducida`
}

// Cerrar mes (superadmin): el mes en curso y los cinco anteriores.
const CLOSABLE_MONTHS = 6
const closablePeriods = computed(() => {
  const current = summary.value?.period
  if (!current) return []
  const periods = [current]
  while (periods.length < CLOSABLE_MONTHS) periods.push(previousMembershipPeriod(periods[periods.length - 1]!))
  return periods
})
const closedPeriods = computed(() => closings.value.map(c => c.period))
const isCloseDialogOpen = ref(false)

async function onClosePeriod(period: string) {
  try {
    await closePeriod(period)
    isCloseDialogOpen.value = false
    toast.success(`Cierre de ${monthName(period).toLowerCase()} guardado`)
    await fetchClosings()
    activeTab.value = 'cierres'
  }
  catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'No se pudo cerrar el mes')
  }
}

const { target, isMounted } = useTopbarPortal()

onMounted(() => {
  fetchSummary()
  fetchUnits()
  fetchClosings()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Buscador y filtros de la lista: solo en "Mes en curso" -->
    <Teleport v-if="isMounted && activeTab === 'en-curso'" :to="target" defer>
      <TopbarSearch v-model="searchQuery" placeholder="Buscar unidad...">
        <TopbarFilters :active="activeFilterCount > 0" :count="activeFilterCount" @clear="clearFilters">
          <TopbarFilterGroup v-model="tierFilter" label="Tarifa" :options="tierOptions" />
          <TopbarFilterGroup v-model="kindFilter" label="Tipo" :options="kindOptions" />
          <TopbarFilterGroup v-model="activeFilter" label="Estado" :options="activeOptions" />
        </TopbarFilters>
      </TopbarSearch>
    </Teleport>

    <Tabs :model-value="activeTab" @update:model-value="onTabChange">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="en-curso">
            <Receipt />
            Mes en curso
          </TabsTrigger>
          <TabsTrigger value="cierres">
            <CalendarCheck />
            Cierres
          </TabsTrigger>
        </TabsList>

        <div v-if="isSuperAdmin" class="flex flex-wrap gap-2">
          <Button variant="outline" class="h-11 md:h-9" as-child>
            <NuxtLink to="/admin/membresia/tarifas">
              <Tags class="size-4" aria-hidden="true" />
              Editar tarifas
            </NuxtLink>
          </Button>
          <Button variant="outline" class="h-11 md:h-9" :disabled="closablePeriods.length === 0" @click="isCloseDialogOpen = true">
            <Lock class="size-4" aria-hidden="true" />
            Cerrar mes
          </Button>
        </div>
      </div>

      <!-- ===== Mes en curso ===== -->
      <TabsContent value="en-curso" class="mt-4 space-y-8">
        <section class="space-y-4" aria-labelledby="current-summary-title">
          <h2 id="current-summary-title" class="text-base font-semibold">
            {{ summary ? monthName(summary.period) : 'Resumen del mes' }}
          </h2>

          <ErrorAlert :message="summaryError" />

          <MembershipTotals
            v-if="!summaryError"
            :totals="summary?.totals ?? null"
            :rates="summary?.rate ?? null"
            :is-loading="isSummaryPending"
          >
            <template #note>
              <p
                v-if="rateNote"
                class="mt-3 text-sm"
                :class="rateNote.upcoming ? 'rounded-lg bg-secondary/10 px-2.5 py-1.5 font-medium text-foreground' : 'text-muted-foreground'"
              >
                {{ rateNote.text }}
              </p>
              <p v-else-if="summary?.rateStatus === 'none'" class="mt-3 text-sm text-muted-foreground">
                No hay ninguna tarifa configurada.
                <NuxtLink
                  v-if="isSuperAdmin"
                  to="/admin/membresia/tarifas"
                  class="rounded-lg font-medium text-accent-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Configurar tarifas
                </NuxtLink>
              </p>
              <p v-if="demoNote" class="mt-1 text-xs text-muted-foreground">{{ demoNote }}</p>
            </template>
          </MembershipTotals>

          <MembershipRuleNote />
        </section>

        <!-- Unidades -->
        <section class="space-y-4" aria-labelledby="current-units-title">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 id="current-units-title" class="text-base font-semibold">
              Unidades
              <span v-if="hasFetchedUnits && !unitsError" class="font-normal tabular-nums text-muted-foreground">{{ meta.total }}</span>
            </h2>
            <Button variant="outline" class="h-11 md:h-9" @click="openMembershipExport()">
              <Download class="size-4" aria-hidden="true" />
              Exportar CSV
            </Button>
          </div>

          <!-- Buscador móvil (en desktop vive en la barra superior) -->
          <div class="md:hidden">
            <TopbarSearch v-model="searchQuery" placeholder="Buscar unidad...">
              <TopbarFilters :active="activeFilterCount > 0" :count="activeFilterCount" @clear="clearFilters">
                <TopbarFilterGroup v-model="tierFilter" label="Tarifa" :options="tierOptions" />
                <TopbarFilterGroup v-model="kindFilter" label="Tipo" :options="kindOptions" />
                <TopbarFilterGroup v-model="activeFilter" label="Estado" :options="activeOptions" />
              </TopbarFilters>
            </TopbarSearch>
          </div>

          <ErrorAlert :message="unitsError" />

          <ListSkeleton v-if="!hasFetchedUnits || (isLoadingUnits && rows.length === 0)" :count="6" variant="row" />

          <EmptyState
            v-else-if="!unitsError && meta.total === 0"
            :icon="unitsEmpty.icon"
            :title="unitsEmpty.title"
            :description="unitsEmpty.description"
          >
            <template v-if="hasFilters" #action>
              <Button variant="outline" @click="clearFilters">Limpiar filtros</Button>
            </template>
          </EmptyState>

          <div v-else-if="rows.length > 0" :aria-busy="isLoadingUnits" class="transition-opacity" :class="isLoadingUnits && 'opacity-60'">
            <MembershipUnitsTable :rows="rows" show-context />
            <ListPagination :current-page="filters.page" :total-pages="totalPages" @update:current-page="setPage" />
          </div>
        </section>
      </TabsContent>

      <!-- ===== Cierres ===== -->
      <TabsContent value="cierres" class="mt-4 space-y-4">
        <p class="max-w-prose text-sm text-muted-foreground">
          Cada cierre guarda la tarifa de cada unidad en ese mes y no cambia después. El mes se cierra solo el día 1 del mes siguiente, la primera vez que alguien abre este panel.
        </p>

        <ErrorAlert :message="closingsError" />

        <ListSkeleton v-if="!hasFetchedClosings || (isLoadingClosings && closings.length === 0)" :count="3" variant="row" />

        <EmptyState
          v-else-if="!closingsError && closings.length === 0"
          :icon="CalendarCheck"
          title="Todavía no hay cierres"
          :description="summary?.rate ? `${monthName(summary.rate.effectiveFrom.slice(0, 7))} será el primer mes con cierre automático.` : undefined"
        >
          <template v-if="isSuperAdmin" #action>
            <Button variant="outline" @click="isCloseDialogOpen = true">
              <Lock class="size-4" aria-hidden="true" />
              Cerrar mes
            </Button>
          </template>
        </EmptyState>

        <ul v-else class="space-y-2">
          <li v-for="closing in closings" :key="closing.id">
            <NuxtLink
              :to="`/admin/membresia/${closing.period}`"
              class="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card class="gap-0 px-4 py-3 transition-colors group-hover:bg-muted/40">
                <div class="flex items-center gap-4">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-baseline gap-x-3">
                      <p class="text-base font-semibold">{{ monthName(closing.period) }}</p>
                      <p class="text-sm text-muted-foreground">{{ tierCountText(closing) }}</p>
                    </div>
                    <p class="mt-0.5 text-xs text-muted-foreground">
                      {{ closingAuthor(closing) }}, el {{ formatDateTime(closing.closedAt) }}
                    </p>
                  </div>
                  <p class="shrink-0 text-base font-bold tabular-nums">{{ formatCurrency(closing.total) }}</p>
                  <ChevronRight class="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                </div>
              </Card>
            </NuxtLink>
          </li>
        </ul>
      </TabsContent>
    </Tabs>

    <MembershipClosePeriodDialog
      v-if="isSuperAdmin"
      v-model:open="isCloseDialogOpen"
      :periods="closablePeriods"
      :closed-periods="closedPeriods"
      :current-period="summary?.period"
      :is-closing="isClosing"
      @confirm="onClosePeriod"
    />
  </div>
</template>
