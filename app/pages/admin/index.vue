<script setup lang="ts">
import {
  AlertTriangle,
  Calendar,
  ClipboardCheck,
  Download,
  FileText,
  Home,
  Percent,
  ShieldAlert,
  Users,
  Vote,
  Wallet,
} from 'lucide-vue-next'
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
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

useHead({ title: 'Panel Administrador' })

const { target, isMounted } = useTopbarPortal()
const { stats, trends, isLoading, exportCsv, exportPdf } = useDashboard()
const { formatCurrency, formatDateTime } = useFormatDate()

// --- Chart label helpers (local, chart-specific) ---

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
      backgroundColor: '#3b9b8f',
      borderRadius: 4,
    }],
  }
})

const financeChartData = computed(() => {
  const items = trends.value?.financeByMonth ?? []
  return {
    labels: items.map(i => monthLabel(i.month)),
    datasets: [
      { label: 'Cargos', data: items.map(i => i.cargos), backgroundColor: '#e85d5d', borderRadius: 4 },
      { label: 'Abonos', data: items.map(i => i.abonos), backgroundColor: '#3b9b8f', borderRadius: 4 },
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
      borderColor: '#e09945',
      backgroundColor: 'rgba(224, 153, 69, 0.15)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: '#e09945',
    }],
  }
})

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { precision: 0 } },
  },
}

const groupedChartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 8 } } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true },
  },
}
</script>

<template>
  <div class="space-y-4">
    <Teleport :to="target" defer v-if="isMounted">
      <Button size="sm" variant="outline" @click="exportCsv">
        <Download class="mr-1.5 size-3.5" />
        <span class="hidden sm:inline">CSV</span>
      </Button>
      <Button size="sm" variant="outline" @click="exportPdf">
        <FileText class="mr-1.5 size-3.5" />
        <span class="hidden sm:inline">PDF</span>
      </Button>
    </Teleport>

    <!-- Tabs -->
    <Tabs default-value="resumen">
      <TabsList class="w-full">
        <TabsTrigger value="resumen" class="flex-1">Resumen</TabsTrigger>
        <TabsTrigger value="finanzas" class="flex-1">Finanzas</TabsTrigger>
        <TabsTrigger value="actividad" class="flex-1">Actividad</TabsTrigger>
      </TabsList>

      <!-- TAB: Resumen -->
      <TabsContent value="resumen" class="mt-4 space-y-5">
        <!-- Next meeting (most time-sensitive first) -->
        <div v-if="stats?.nextMeeting" class="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div class="flex size-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
            <Calendar class="size-5" />
          </div>
          <div class="min-w-0">
            <p class="truncate text-base font-medium">{{ stats.nextMeeting.title }}</p>
            <p class="text-sm text-muted-foreground">{{ formatDateTime(stats.nextMeeting.date) }}</p>
          </div>
        </div>

        <!-- Operaciones -->
        <div class="space-y-2">
          <p class="text-sm font-medium uppercase tracking-wider text-muted-foreground/70">Operaciones</p>
          <div class="grid grid-cols-2 gap-3">
            <StatCard
              label="Incidencias abiertas"
              :value="stats?.openIncidents ?? 0"
              :icon="AlertTriangle"
              icon-bg-class="bg-amber-100 text-amber-600"
              :is-loading="isLoading"
            />
            <StatCard
              label="En progreso"
              :value="stats?.inProgressIncidents ?? 0"
              :icon="ShieldAlert"
              icon-bg-class="bg-blue-100 text-blue-600"
              :is-loading="isLoading"
            />
          </div>
        </div>

        <Separator class="opacity-40" />

        <!-- Comunidad -->
        <div class="space-y-2">
          <p class="text-sm font-medium uppercase tracking-wider text-muted-foreground/70">Comunidad</p>
          <div class="grid grid-cols-2 gap-3">
            <StatCard
              label="Votaciones activas"
              :value="stats?.activePolls ?? 0"
              :icon="Vote"
              icon-bg-class="bg-purple-100 text-purple-600"
              :is-loading="isLoading"
            />
            <StatCard
              label="Reuniones proximas"
              :value="stats?.upcomingMeetings ?? 0"
              :icon="Users"
              icon-bg-class="bg-emerald-100 text-emerald-600"
              :is-loading="isLoading"
            />
          </div>
        </div>

        <Separator class="opacity-40" />

        <!-- Condominio -->
        <div class="space-y-2">
          <p class="text-sm font-medium uppercase tracking-wider text-muted-foreground/70">Condominio</p>
          <div class="grid grid-cols-2 gap-3">
            <StatCard
              label="Unidades"
              :value="stats?.totalUnits ?? 0"
              :icon="Home"
              icon-bg-class="bg-blue-100 text-blue-600"
              :is-loading="isLoading"
            />
            <StatCard
              label="En mora"
              :value="stats?.unitsInDebt ?? 0"
              :icon="Wallet"
              icon-bg-class="bg-red-100 text-red-600"
              :is-loading="isLoading"
            />
          </div>
        </div>

        <Separator class="opacity-40" />

        <!-- Finance snapshot -->
        <div class="space-y-2">
          <p class="text-sm font-medium uppercase tracking-wider text-muted-foreground/70">Finanzas del mes</p>
          <div class="grid grid-cols-3 gap-3">
            <StatCard
              label="Cobrado"
              :value="trends?.financialKpis ? formatCurrency(trends.financialKpis.totalAbonos) : '—'"
              :icon="ClipboardCheck"
              icon-bg-class="bg-emerald-100 text-emerald-600"
              :is-loading="isLoading"
            />
            <StatCard
              label="Pendiente"
              :value="trends?.financialKpis ? formatCurrency(trends.financialKpis.pendingBalance) : '—'"
              :icon="Wallet"
              icon-bg-class="bg-red-100 text-red-600"
              :is-loading="isLoading"
            />
            <StatCard
              label="Cobranza"
              :value="trends?.financialKpis ? `${trends.financialKpis.collectionRate.toFixed(1)}%` : '—'"
              :icon="Percent"
              icon-bg-class="bg-blue-100 text-blue-600"
              :is-loading="isLoading"
            />
          </div>
        </div>
      </TabsContent>

      <!-- TAB: Finanzas -->
      <TabsContent value="finanzas" class="mt-4 space-y-5">
        <!-- KPI cards -->
        <div class="grid grid-cols-2 gap-3">
          <StatCard
            label="Cobrado este mes"
            :value="trends?.financialKpis ? formatCurrency(trends.financialKpis.totalAbonos) : '—'"
            :icon="ClipboardCheck"
            icon-bg-class="bg-emerald-100 text-emerald-600"
            :is-loading="isLoading"
          />
          <StatCard
            label="Cargos este mes"
            :value="trends?.financialKpis ? formatCurrency(trends.financialKpis.totalCargos) : '—'"
            :icon="Wallet"
            icon-bg-class="bg-muted text-muted-foreground"
            :is-loading="isLoading"
          />
          <StatCard
            label="Pendiente total"
            :value="trends?.financialKpis ? formatCurrency(trends.financialKpis.pendingBalance) : '—'"
            :icon="AlertTriangle"
            icon-bg-class="bg-red-100 text-red-600"
            :is-loading="isLoading"
          />
          <StatCard
            label="Tasa de cobranza"
            :value="trends?.financialKpis ? `${trends.financialKpis.collectionRate.toFixed(1)}%` : '—'"
            :icon="Percent"
            icon-bg-class="bg-blue-100 text-blue-600"
            :is-loading="isLoading"
          />
        </div>

        <!-- Unidades en mora badge -->
        <div class="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div class="flex size-10 items-center justify-center rounded-md bg-red-100 text-red-600">
            <Wallet class="size-5" />
          </div>
          <div>
            <p class="text-sm font-semibold">{{ stats?.unitsInDebt ?? 0 }} {{ (stats?.unitsInDebt ?? 0) === 1 ? 'unidad' : 'unidades' }} en mora</p>
            <p class="text-sm text-muted-foreground">de {{ stats?.totalUnits ?? 0 }} totales</p>
          </div>
        </div>

        <!-- Finance chart -->
        <div class="rounded-lg border bg-card p-4">
          <p class="mb-2 text-sm font-semibold text-muted-foreground">Cargos vs Abonos (6 meses)</p>
          <div v-if="isLoading" class="h-56">
            <Skeleton class="h-full w-full rounded-md" />
          </div>
          <div v-else class="h-56">
            <Bar :data="financeChartData" :options="groupedChartOpts" />
          </div>
        </div>
      </TabsContent>

      <!-- TAB: Actividad -->
      <TabsContent value="actividad" class="mt-4 space-y-5">
        <!-- Access chart -->
        <div class="rounded-lg border bg-card p-4">
          <p class="mb-2 text-sm font-semibold text-muted-foreground">Accesos (ultimos 7 dias)</p>
          <div v-if="isLoading" class="h-56">
            <Skeleton class="h-full w-full rounded-md" />
          </div>
          <div v-else class="h-56">
            <Bar :data="accessChartData" :options="chartOpts" />
          </div>
        </div>

        <!-- Incidents chart -->
        <div class="rounded-lg border bg-card p-4">
          <p class="mb-2 text-sm font-semibold text-muted-foreground">Incidencias (6 meses)</p>
          <div v-if="isLoading" class="h-56">
            <Skeleton class="h-full w-full rounded-md" />
          </div>
          <div v-else class="h-56">
            <Line :data="incidentsChartData" :options="chartOpts" />
          </div>
        </div>

        <!-- Quick incident stats -->
        <div class="grid grid-cols-2 gap-3">
          <StatCard
            label="Abiertas"
            :value="stats?.openIncidents ?? 0"
            :icon="AlertTriangle"
            icon-bg-class="bg-amber-100 text-amber-600"
            :is-loading="isLoading"
          />
          <StatCard
            label="En progreso"
            :value="stats?.inProgressIncidents ?? 0"
            :icon="ShieldAlert"
            icon-bg-class="bg-blue-100 text-blue-600"
            :is-loading="isLoading"
          />
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
