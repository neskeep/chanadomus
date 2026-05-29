<script setup lang="ts">
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileText,
  Home,
  Info,
  Megaphone,
  Percent,
  ShieldAlert,
  Store,
  Users,
  Vote,
  Wallet,
} from 'lucide-vue-next'
import { ICON_BG } from '~/composables/useColorMap'
import { Bar, Line } from 'vue-chartjs'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip as ChartTooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, ChartTooltip, Legend, Filler)

useHead({ title: 'Panel Administrador' })

const { target, isMounted } = useTopbarPortal()
const { stats, trends, isLoading, exportCsv, exportPdf } = useDashboard()
const { formatCurrency, formatDateTime } = useFormatDate()

const collectionRate = computed(() => trends.value?.financialKpis?.collectionRate ?? 0)

const hasAttentionItems = computed(() =>
  (stats.value?.openIncidents ?? 0) > 0 || (stats.value?.pendingProviders ?? 0) > 0
)

// --- Chart helpers ---

function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('es-VE', { month: 'short' })
}

function dayLabel(yyyymmdd: string): string {
  return new Date(yyyymmdd).toLocaleDateString('es-VE', { weekday: 'short' })
}

// --- Chart data ---

const accessChartData = computed(() => {
  const items = trends.value?.accessByDay ?? []
  return {
    labels: items.map(i => dayLabel(i.day)),
    datasets: [{
      label: 'Accesos',
      data: items.map(i => i.count),
      backgroundColor: '#19C2C0',
      borderRadius: 6,
    }],
  }
})

const financeChartData = computed(() => {
  const items = trends.value?.financeByMonth ?? []
  return {
    labels: items.map(i => monthLabel(i.month)),
    datasets: [
      { label: 'Cargos', data: items.map(i => i.cargos), backgroundColor: '#E53B3B', borderRadius: 6 },
      { label: 'Abonos', data: items.map(i => i.abonos), backgroundColor: '#19C2C0', borderRadius: 6 },
    ],
  }
})

const incidentsChartData = computed(() => {
  const items = trends.value?.incidentsByMonth ?? []
  return {
    labels: items.map(i => monthLabel(i.month)),
    datasets: [{
      label: 'Incidencias',
      data: items.map(i => i.count),
      borderColor: '#F47A1F',
      backgroundColor: 'rgba(244, 122, 31, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#F47A1F',
      borderWidth: 2,
    }],
  }
})

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
  },
}

const groupedChartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 10, padding: 12, font: { size: 11 } } } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
  },
}
</script>

<template>
  <div class="space-y-8">
    <!-- Topbar: export actions -->
    <Teleport :to="target" defer v-if="isMounted">
      <Button variant="ghost" size="icon" class="size-8" @click="exportCsv" title="Exportar CSV">
        <Download class="size-4" />
      </Button>
      <Button variant="ghost" size="icon" class="size-8" @click="exportPdf" title="Exportar PDF">
        <FileText class="size-4" />
      </Button>
    </Teleport>

    <!-- Mobile action buttons -->
    <TopbarMobileAction>
      <Button variant="ghost" size="icon" class="size-9" @click="exportCsv" title="Exportar CSV">
        <Download class="size-4" />
      </Button>
      <Button variant="ghost" size="icon" class="size-9" @click="exportPdf" title="Exportar PDF">
        <FileText class="size-4" />
      </Button>
    </TopbarMobileAction>

    <!-- Financial hero: 3 stat cards + collection rate with progress -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Cobrado este mes"
        :value="trends?.financialKpis ? formatCurrency(trends.financialKpis.totalAbonos) : '—'"
        :icon="ClipboardCheck"
        :icon-bg-class="ICON_BG.success"
        tooltip="Total de pagos recibidos en el mes actual"
        :is-loading="isLoading"
      />
      <StatCard
        label="Pendiente"
        :value="trends?.financialKpis ? formatCurrency(trends.financialKpis.pendingBalance) : '—'"
        :icon="Wallet"
        :icon-bg-class="ICON_BG.danger"
        tooltip="Saldo total pendiente de cobro acumulado"
        :is-loading="isLoading"
      />
      <StatCard
        :label="`En mora — ${stats?.unitsInDebt ?? 0} de ${stats?.totalUnits ?? 0}`"
        :value="stats?.unitsInDebt ?? 0"
        :icon="Home"
        :icon-bg-class="ICON_BG.warning"
        tooltip="Unidades con pagos pendientes respecto al total"
        :is-loading="isLoading"
      />
      <!-- Collection rate: custom card with Progress bar -->
      <Card class="p-3 sm:p-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex size-7 shrink-0 items-center justify-center rounded-lg sm:order-2 sm:size-10" :class="ICON_BG.teal">
            <Percent class="size-3.5 sm:size-5" />
          </div>
          <div class="flex min-w-0 flex-col gap-0.5 sm:order-1 sm:gap-1">
            <template v-if="isLoading">
              <Skeleton class="h-4 w-12 sm:h-5 sm:w-16" />
              <Skeleton class="h-6 w-10 sm:h-8 sm:w-24" />
            </template>
            <template v-else>
              <div class="flex items-center gap-1">
                <p class="text-[11px] leading-tight text-muted-foreground sm:text-sm">Cobranza</p>
                <TooltipProvider :delay-duration="200">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Info class="size-3 shrink-0 cursor-help text-muted-foreground/50 transition-colors hover:text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top" class="max-w-56 text-xs">
                      Porcentaje de cobranza del mes actual: abonos recibidos vs cargos emitidos
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p class="text-lg font-bold tabular-nums tracking-tight sm:text-2xl">{{ collectionRate.toFixed(1) }}%</p>
            </template>
          </div>
        </div>
        <Progress v-if="!isLoading" :model-value="collectionRate" class="mt-3 h-1.5" />
        <Skeleton v-else class="mt-3 h-1.5 w-full rounded-lg" />
      </Card>
    </div>

    <!-- Attention required — hide when nothing pending -->
    <Card v-if="hasAttentionItems" class="p-5">
      <h3 class="text-sm font-semibold mb-3">Requiere atención</h3>
      <div class="space-y-2">
        <NuxtLink v-if="(stats?.openIncidents ?? 0) > 0" to="/admin/incidencias" class="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent">
          <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <AlertTriangle class="size-4 text-amber-600" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium">{{ stats.openIncidents }} incidencias abiertas</p>
          </div>
          <ChevronRight class="size-4 text-muted-foreground" />
        </NuxtLink>
        <NuxtLink v-if="(stats?.pendingProviders ?? 0) > 0" to="/admin/proveedores" class="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent">
          <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
            <Store class="size-4 text-blue-600" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium">{{ stats.pendingProviders }} proveedores por aprobar</p>
          </div>
          <ChevronRight class="size-4 text-muted-foreground" />
        </NuxtLink>
      </div>
    </Card>

    <!-- Charts row 1: Finance + Access -->
    <div class="grid gap-4 lg:grid-cols-2">
      <!-- Finance chart -->
      <Card class="p-5">
        <div class="mb-4">
          <h3 class="text-sm font-semibold">Cargos vs Abonos</h3>
          <p class="text-xs text-muted-foreground">Últimos 6 meses</p>
        </div>
        <div v-if="isLoading" class="h-56">
          <Skeleton class="h-full w-full rounded-lg" />
        </div>
        <div v-else class="h-56">
          <Bar :data="financeChartData" :options="groupedChartOpts" />
        </div>
      </Card>

      <!-- Access chart -->
      <Card class="p-5">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold">Accesos</h3>
            <p class="text-xs text-muted-foreground">Últimos 7 días</p>
          </div>
          <Badge v-if="!isLoading" variant="secondary" class="tabular-nums">
            {{ stats?.todayAccessCount ?? 0 }} hoy
          </Badge>
        </div>
        <div v-if="isLoading" class="h-56">
          <Skeleton class="h-full w-full rounded-lg" />
        </div>
        <div v-else class="h-56">
          <Bar :data="accessChartData" :options="chartOpts" />
        </div>
      </Card>
    </div>

    <!-- Charts row 2: Incidents + Activity summary -->
    <div class="grid gap-4 lg:grid-cols-2">
      <!-- Incidents chart -->
      <Card class="p-5">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold">Incidencias</h3>
            <p class="text-xs text-muted-foreground">Últimos 6 meses</p>
          </div>
          <div v-if="!isLoading" class="flex items-center gap-3 text-xs text-muted-foreground">
            <span class="flex items-center gap-1.5">
              <span class="size-2 rounded-lg bg-amber-500" />
              {{ stats?.openIncidents ?? 0 }} abiertas
            </span>
            <span class="flex items-center gap-1.5">
              <span class="size-2 rounded-lg bg-blue-500" />
              {{ stats?.inProgressIncidents ?? 0 }} en progreso
            </span>
          </div>
        </div>
        <div v-if="isLoading" class="h-56">
          <Skeleton class="h-full w-full rounded-lg" />
        </div>
        <div v-else class="h-56">
          <Line :data="incidentsChartData" :options="chartOpts" />
        </div>
      </Card>

      <!-- Activity summary -->
      <Card class="p-5">
        <h3 class="text-sm font-semibold mb-5">Actividad del condominio</h3>

        <div class="space-y-4">
          <!-- Next meeting highlight -->
          <div v-if="stats?.nextMeeting" class="flex items-center gap-3 rounded-lg bg-accent/50 p-3">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <Calendar class="size-4 text-emerald-600" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium truncate">{{ stats.nextMeeting.title }}</p>
              <p class="text-xs text-muted-foreground">{{ formatDateTime(stats.nextMeeting.date) }}</p>
            </div>
          </div>

          <!-- Community stats grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center gap-3">
              <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                <Vote class="size-4 text-purple-600" />
              </div>
              <div>
                <p class="text-lg font-bold tabular-nums leading-none">{{ stats?.activePolls ?? 0 }}</p>
                <p class="mt-0.5 text-xs text-muted-foreground">Votaciones activas</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                <Users class="size-4 text-emerald-600" />
              </div>
              <div>
                <p class="text-lg font-bold tabular-nums leading-none">{{ stats?.upcomingMeetings ?? 0 }}</p>
                <p class="mt-0.5 text-xs text-muted-foreground">Reuniones próximas</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <Megaphone class="size-4 text-blue-600" />
              </div>
              <div>
                <p class="text-lg font-bold tabular-nums leading-none">{{ stats?.publishedAnnouncements ?? 0 }}</p>
                <p class="mt-0.5 text-xs text-muted-foreground">Anuncios</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <AlertTriangle class="size-4 text-amber-600" />
              </div>
              <div>
                <p class="text-lg font-bold tabular-nums leading-none">{{ stats?.openIncidents ?? 0 }}</p>
                <p class="mt-0.5 text-xs text-muted-foreground">Incidencias abiertas</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
