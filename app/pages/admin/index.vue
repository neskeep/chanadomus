<script setup lang="ts">
import {
  AlertTriangle,
  BellRing,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileText,
  Home,
  Megaphone,
  Percent,
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
const { stats: pushStats, statsError: pushStatsError, fetchStats: fetchPushStats } = usePushStats()

onMounted(fetchPushStats)

const collectionRate = computed(() => trends.value?.financialKpis?.collectionRate ?? 0)

const hasAttentionItems = computed(() =>
  (stats.value?.openIncidents ?? 0) > 0 || (stats.value?.pendingProviders ?? 0) > 0
)

// --- Chart helpers ---

function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('es-VE', { month: 'short' })
}

// YYYY-MM-DD es una fecha de calendario: se formatea en UTC para que la zona del navegador no la desplace
function dayLabel(yyyymmdd: string): string {
  return new Date(`${yyyymmdd}T12:00:00Z`).toLocaleDateString('es-VE', { weekday: 'short', timeZone: 'UTC' })
}

// El servidor devuelve 7 días terminando hoy: el badge "N hoy" es la última barra
const todayAccessCount = computed(() => {
  const items = trends.value?.accessByDay ?? []
  return items.at(-1)?.count ?? stats.value?.todayAccessCount ?? 0
})

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
    <Teleport v-if="isMounted" :to="target" defer>
      <Button variant="ghost" size="icon" class="size-8" title="Exportar CSV" @click="exportCsv">
        <Download class="size-4" />
      </Button>
      <Button variant="ghost" size="icon" class="size-8" title="Exportar PDF" @click="exportPdf">
        <FileText class="size-4" />
      </Button>
    </Teleport>

    <!-- Mobile action buttons -->
    <TopbarMobileAction>
      <Button variant="ghost" size="icon" class="size-9" title="Exportar CSV" @click="exportCsv">
        <Download class="size-4" />
      </Button>
      <Button variant="ghost" size="icon" class="size-9" title="Exportar PDF" @click="exportPdf">
        <FileText class="size-4" />
      </Button>
    </TopbarMobileAction>

    <!-- KPIs: 3 financieros + cobranza + alcance de notificaciones -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
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
      <ProgressStatCard
        label="Cobranza"
        :value="`${collectionRate.toFixed(1)}%`"
        :progress="collectionRate"
        :icon="Percent"
        :icon-bg-class="ICON_BG.teal"
        tooltip="Porcentaje de cobranza del mes actual: abonos recibidos vs cargos emitidos"
        :is-loading="isLoading"
      />
      <!-- Alcance de notificaciones push: a lo ancho bajo lg, quinta columna desde xl -->
      <ProgressStatCard
        class="col-span-2 lg:col-span-4 xl:col-span-1"
        label="Notificaciones activas"
        :value="pushStats ? `${pushStats.summary.percentage.toFixed(1)}%` : '—'"
        :progress="pushStats?.summary.percentage ?? 0"
        :icon="BellRing"
        :icon-bg-class="ICON_BG.orange"
        tooltip="Usuarios que activaron los avisos en al menos un dispositivo. Sin ellos no reciben avisos del chat ni de accesos."
        :caption="pushStats ? `${pushStats.summary.usersWithPush} de ${pushStats.summary.totalUsers} usuarios` : undefined"
        to="/admin/notificaciones?tab=alcance"
        link-label="Ver quién no tiene los avisos activos"
        :is-loading="!pushStats && !pushStatsError"
      />
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
            <p class="text-sm font-medium">{{ stats!.openIncidents }} incidencias abiertas</p>
          </div>
          <ChevronRight class="size-4 text-muted-foreground" />
        </NuxtLink>
        <NuxtLink v-if="(stats?.pendingProviders ?? 0) > 0" to="/admin/proveedores" class="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent">
          <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
            <Store class="size-4 text-blue-600" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium">{{ stats!.pendingProviders }} proveedores por aprobar</p>
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
            {{ todayAccessCount }} hoy
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
