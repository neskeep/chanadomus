<script setup lang="ts">
import {
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  Download,
  FileText,
  Percent,
  TrendingUp,
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

definePageMeta({ layout: 'default', title: 'Panel Administrador' })

const { stats, trends, isLoading, exportCsv, exportPdf } = useDashboard()

// --- Formatting helpers ---

function formatCurrency(n: number): string {
  return `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('es-VE', { month: 'short' })
}

function dayLabel(yyyymmdd: string): string {
  return new Date(yyyymmdd).toLocaleDateString('es-VE', { weekday: 'short' })
}

// --- KPI cards ---

const kpiCards = computed(() => {
  const kpis = trends.value?.financialKpis
  return [
    {
      label: 'Cobrado este mes',
      value: kpis ? formatCurrency(kpis.totalAbonos) : '—',
      icon: DollarSign,
      color: 'emerald',
    },
    {
      label: 'Pendiente total',
      value: kpis ? formatCurrency(kpis.pendingBalance) : '—',
      icon: Wallet,
      color: kpis && kpis.pendingBalance > 0 ? 'destructive' : 'slate',
    },
    {
      label: 'Tasa cobranza',
      value: kpis ? `${kpis.collectionRate.toFixed(1)}%` : '—',
      icon: Percent,
      color: 'blue',
    },
  ]
})

const kpiColorMap: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  destructive: 'bg-red-100 text-red-600 dark:bg-red-900/30',
}

// --- Stat cards ---

const statCards = computed(() => [
  { label: 'Incidencias Abiertas', value: stats.value?.openIncidents ?? 0, icon: AlertTriangle, color: 'amber' },
  { label: 'En Progreso', value: stats.value?.inProgressIncidents ?? 0, icon: AlertTriangle, color: 'blue' },
  { label: 'Unidades', value: stats.value?.totalUnits ?? 0, icon: Building2, color: 'slate' },
  { label: 'En Mora', value: stats.value?.unitsInDebt ?? 0, icon: Wallet, color: 'red' },
  { label: 'Votaciones Activas', value: stats.value?.activePolls ?? 0, icon: Vote, color: 'purple' },
  { label: 'Reuniones Proximas', value: stats.value?.upcomingMeetings ?? 0, icon: Calendar, color: 'emerald' },
])

const colorMap: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/30',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30',
}

// --- Chart data ---

const accessChartData = computed(() => {
  const items = trends.value?.accessByDay ?? []
  return {
    labels: items.map(i => dayLabel(i.day)),
    datasets: [
      {
        label: 'Accesos',
        data: items.map(i => i.count),
        backgroundColor: '#2d9e9e',
        borderRadius: 4,
      },
    ],
  }
})

const financeChartData = computed(() => {
  const items = trends.value?.financeByMonth ?? []
  return {
    labels: items.map(i => monthLabel(i.month)),
    datasets: [
      {
        label: 'Cargos',
        data: items.map(i => i.cargos),
        backgroundColor: '#ef4444',
        borderRadius: 4,
      },
      {
        label: 'Abonos',
        data: items.map(i => i.abonos),
        backgroundColor: '#22c55e',
        borderRadius: 4,
      },
    ],
  }
})

const incidentsChartData = computed(() => {
  const items = trends.value?.incidentsByMonth ?? []
  return {
    labels: items.map(i => monthLabel(i.month)),
    datasets: [
      {
        label: 'Incidencias',
        data: items.map(i => i.count),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: '#f59e0b',
      },
    ],
  }
})

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { precision: 0 } },
  },
}

const groupedBarChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 8 } } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true },
  },
}

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { precision: 0 } },
  },
}
</script>

<template>
  <div class="space-y-3">
    <!-- 1. Export buttons -->
    <div class="flex justify-end gap-2">
      <Button variant="outline" size="sm" @click="exportCsv">
        <Download class="mr-1.5 size-3.5" />
        <span class="hidden sm:inline">CSV</span>
      </Button>
      <Button variant="outline" size="sm" @click="exportPdf">
        <FileText class="mr-1.5 size-3.5" />
        <span class="hidden sm:inline">PDF</span>
      </Button>
    </div>

    <!-- 2. Financial KPIs -->
    <div class="grid grid-cols-3 gap-2">
      <div
        v-for="(kpi, i) in kpiCards"
        :key="i"
        class="flex items-center gap-2 rounded-lg border bg-card p-3 md:gap-3"
      >
        <div
          class="flex size-9 shrink-0 items-center justify-center rounded-md"
          :class="kpiColorMap[kpi.color]"
        >
          <component :is="kpi.icon" class="size-4" />
        </div>
        <div v-if="isLoading" class="space-y-1">
          <Skeleton class="h-5 w-12" />
          <Skeleton class="h-3 w-16" />
        </div>
        <div v-else class="min-w-0">
          <p
            class="truncate text-sm font-bold leading-none md:text-base"
            :class="kpi.color === 'destructive' ? 'text-destructive' : ''"
          >
            {{ kpi.value }}
          </p>
          <p class="mt-0.5 truncate text-[11px] text-muted-foreground">{{ kpi.label }}</p>
        </div>
      </div>
    </div>

    <!-- 3. Stat cards -->
    <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
      <div
        v-for="(card, i) in statCards"
        :key="i"
        class="flex items-center gap-3 rounded-lg border bg-card p-3"
      >
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded-md"
          :class="colorMap[card.color]"
        >
          <component :is="card.icon" class="size-4" />
        </div>
        <div v-if="isLoading" class="space-y-1">
          <Skeleton class="h-5 w-8" />
          <Skeleton class="h-3 w-16" />
        </div>
        <div v-else>
          <p class="text-lg font-bold leading-none">{{ card.value }}</p>
          <p class="mt-0.5 text-[11px] text-muted-foreground">{{ card.label }}</p>
        </div>
      </div>
    </div>

    <!-- 4. Charts: Access + Finance side by side -->
    <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
      <!-- Chart A: Accesos (7 dias) -->
      <div class="rounded-lg border bg-card p-3">
        <p class="mb-2 text-xs font-semibold text-muted-foreground">Accesos (7 dias)</p>
        <div v-if="isLoading" class="flex h-56 items-center justify-center">
          <Skeleton class="h-full w-full rounded-md" />
        </div>
        <div v-else class="h-56">
          <Bar :data="accessChartData" :options="barChartOptions" />
        </div>
      </div>

      <!-- Chart B: Finanzas (6 meses) -->
      <div class="rounded-lg border bg-card p-3">
        <p class="mb-2 text-xs font-semibold text-muted-foreground">Finanzas (6 meses)</p>
        <div v-if="isLoading" class="flex h-56 items-center justify-center">
          <Skeleton class="h-full w-full rounded-md" />
        </div>
        <div v-else class="h-56">
          <Bar :data="financeChartData" :options="groupedBarChartOptions" />
        </div>
      </div>
    </div>

    <!-- 5. Incidents trend: Line chart -->
    <div class="rounded-lg border bg-card p-3">
      <p class="mb-2 text-xs font-semibold text-muted-foreground">Incidencias (6 meses)</p>
      <div v-if="isLoading" class="flex h-56 items-center justify-center">
        <Skeleton class="h-full w-full rounded-md" />
      </div>
      <div v-else class="h-56">
        <Line :data="incidentsChartData" :options="lineChartOptions" />
      </div>
    </div>

    <!-- 6. Next meeting -->
    <div v-if="stats?.nextMeeting" class="rounded-lg border bg-card p-3">
      <p class="text-[11px] font-medium text-muted-foreground">Proxima reunion</p>
      <p class="mt-0.5 text-sm font-medium">{{ stats.nextMeeting.title }}</p>
      <p class="text-[11px] text-muted-foreground">{{ formatDate(stats.nextMeeting.date) }}</p>
    </div>
  </div>
</template>
