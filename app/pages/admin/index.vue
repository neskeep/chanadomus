<script setup lang="ts">
import {
  AlertTriangle,
  ArrowDownUp,
  Building2,
  Calendar,
  DollarSign,
  Download,
  FileText,
  Percent,
  ShieldAlert,
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

// --- Stat cards ---

const statCards = computed(() => [
  { label: 'Incidencias', value: stats.value?.openIncidents ?? 0, icon: AlertTriangle, color: 'amber' },
  { label: 'En Progreso', value: stats.value?.inProgressIncidents ?? 0, icon: ShieldAlert, color: 'blue' },
  { label: 'Unidades', value: stats.value?.totalUnits ?? 0, icon: Building2, color: 'slate' },
  { label: 'En Mora', value: stats.value?.unitsInDebt ?? 0, icon: Wallet, color: 'red' },
  { label: 'Votaciones', value: stats.value?.activePolls ?? 0, icon: Vote, color: 'purple' },
  { label: 'Reuniones', value: stats.value?.upcomingMeetings ?? 0, icon: Calendar, color: 'emerald' },
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
    datasets: [{
      label: 'Accesos',
      data: items.map(i => i.count),
      backgroundColor: '#2d9e9e',
      borderRadius: 4,
    }],
  }
})

const financeChartData = computed(() => {
  const items = trends.value?.financeByMonth ?? []
  return {
    labels: items.map(i => monthLabel(i.month)),
    datasets: [
      { label: 'Cargos', data: items.map(i => i.cargos), backgroundColor: '#ef4444', borderRadius: 4 },
      { label: 'Abonos', data: items.map(i => i.abonos), backgroundColor: '#22c55e', borderRadius: 4 },
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
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: '#f59e0b',
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
  <div class="space-y-3">
    <!-- Export buttons -->
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

    <!-- Tabs -->
    <Tabs default-value="resumen">
      <TabsList class="w-full">
        <TabsTrigger value="resumen" class="flex-1">Resumen</TabsTrigger>
        <TabsTrigger value="finanzas" class="flex-1">Finanzas</TabsTrigger>
        <TabsTrigger value="actividad" class="flex-1">Actividad</TabsTrigger>
      </TabsList>

      <!-- TAB: Resumen -->
      <TabsContent value="resumen" class="mt-3 space-y-2">
        <!-- Stat cards: 3 cols -->
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="(card, i) in statCards"
            :key="i"
            class="rounded-lg border bg-card p-2.5"
          >
            <div
              class="flex size-7 items-center justify-center rounded-md"
              :class="colorMap[card.color]"
            >
              <component :is="card.icon" class="size-3.5" />
            </div>
            <div v-if="isLoading" class="mt-1.5">
              <Skeleton class="h-5 w-6" />
              <Skeleton class="mt-1 h-3 w-12" />
            </div>
            <template v-else>
              <p class="mt-1.5 text-xl font-bold leading-none">{{ card.value }}</p>
              <p class="mt-0.5 text-[11px] text-muted-foreground">{{ card.label }}</p>
            </template>
          </div>
        </div>

        <!-- Next meeting -->
        <div v-if="stats?.nextMeeting" class="rounded-lg border bg-card p-3">
          <div class="flex items-center gap-2">
            <div class="flex size-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
              <Calendar class="size-3.5" />
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ stats.nextMeeting.title }}</p>
              <p class="text-[11px] text-muted-foreground">{{ formatDate(stats.nextMeeting.date) }}</p>
            </div>
          </div>
        </div>

        <!-- Quick finance snapshot -->
        <div class="rounded-lg border bg-card p-3">
          <p class="mb-2 text-xs font-semibold text-muted-foreground">Snapshot financiero</p>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <div class="flex items-center gap-1">
                <DollarSign class="size-3 text-emerald-500" />
                <span class="text-[10px] text-muted-foreground">Cobrado</span>
              </div>
              <p v-if="isLoading"><Skeleton class="mt-1 h-4 w-14" /></p>
              <p v-else class="mt-0.5 text-sm font-semibold">
                {{ trends?.financialKpis ? formatCurrency(trends.financialKpis.totalAbonos) : '—' }}
              </p>
            </div>
            <div>
              <div class="flex items-center gap-1">
                <ArrowDownUp class="size-3 text-red-500" />
                <span class="text-[10px] text-muted-foreground">Pendiente</span>
              </div>
              <p v-if="isLoading"><Skeleton class="mt-1 h-4 w-14" /></p>
              <p v-else class="mt-0.5 text-sm font-semibold" :class="(trends?.financialKpis?.pendingBalance ?? 0) > 0 ? 'text-destructive' : ''">
                {{ trends?.financialKpis ? formatCurrency(trends.financialKpis.pendingBalance) : '—' }}
              </p>
            </div>
            <div>
              <div class="flex items-center gap-1">
                <Percent class="size-3 text-blue-500" />
                <span class="text-[10px] text-muted-foreground">Cobranza</span>
              </div>
              <p v-if="isLoading"><Skeleton class="mt-1 h-4 w-14" /></p>
              <p v-else class="mt-0.5 text-sm font-semibold">
                {{ trends?.financialKpis ? `${trends.financialKpis.collectionRate.toFixed(1)}%` : '—' }}
              </p>
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- TAB: Finanzas -->
      <TabsContent value="finanzas" class="mt-3 space-y-3">
        <!-- KPI cards grandes -->
        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-lg border bg-card p-3">
            <p class="text-[11px] text-muted-foreground">Cobrado este mes</p>
            <p v-if="isLoading"><Skeleton class="mt-1 h-6 w-24" /></p>
            <p v-else class="mt-1 text-lg font-bold text-emerald-600">
              {{ trends?.financialKpis ? formatCurrency(trends.financialKpis.totalAbonos) : '—' }}
            </p>
          </div>
          <div class="rounded-lg border bg-card p-3">
            <p class="text-[11px] text-muted-foreground">Cargos este mes</p>
            <p v-if="isLoading"><Skeleton class="mt-1 h-6 w-24" /></p>
            <p v-else class="mt-1 text-lg font-bold">
              {{ trends?.financialKpis ? formatCurrency(trends.financialKpis.totalCargos) : '—' }}
            </p>
          </div>
          <div class="rounded-lg border bg-card p-3">
            <p class="text-[11px] text-muted-foreground">Pendiente total</p>
            <p v-if="isLoading"><Skeleton class="mt-1 h-6 w-24" /></p>
            <p v-else class="mt-1 text-lg font-bold" :class="(trends?.financialKpis?.pendingBalance ?? 0) > 0 ? 'text-destructive' : ''">
              {{ trends?.financialKpis ? formatCurrency(trends.financialKpis.pendingBalance) : '—' }}
            </p>
          </div>
          <div class="rounded-lg border bg-card p-3">
            <p class="text-[11px] text-muted-foreground">Tasa de cobranza</p>
            <p v-if="isLoading"><Skeleton class="mt-1 h-6 w-24" /></p>
            <p v-else class="mt-1 text-lg font-bold text-blue-600">
              {{ trends?.financialKpis ? `${trends.financialKpis.collectionRate.toFixed(1)}%` : '—' }}
            </p>
          </div>
        </div>

        <!-- Unidades en mora badge -->
        <div class="flex items-center gap-2 rounded-lg border bg-card p-3">
          <div class="flex size-8 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-900/30">
            <Wallet class="size-4" />
          </div>
          <div>
            <p class="text-sm font-semibold">{{ stats?.unitsInDebt ?? 0 }} unidades en mora</p>
            <p class="text-[11px] text-muted-foreground">de {{ stats?.totalUnits ?? 0 }} totales</p>
          </div>
        </div>

        <!-- Finance chart -->
        <div class="rounded-lg border bg-card p-3">
          <p class="mb-2 text-xs font-semibold text-muted-foreground">Cargos vs Abonos (6 meses)</p>
          <div v-if="isLoading" class="h-52">
            <Skeleton class="h-full w-full rounded-md" />
          </div>
          <div v-else class="h-52">
            <Bar :data="financeChartData" :options="groupedChartOpts" />
          </div>
        </div>
      </TabsContent>

      <!-- TAB: Actividad -->
      <TabsContent value="actividad" class="mt-3 space-y-3">
        <!-- Access chart -->
        <div class="rounded-lg border bg-card p-3">
          <p class="mb-2 text-xs font-semibold text-muted-foreground">Accesos (ultimos 7 dias)</p>
          <div v-if="isLoading" class="h-48">
            <Skeleton class="h-full w-full rounded-md" />
          </div>
          <div v-else class="h-48">
            <Bar :data="accessChartData" :options="chartOpts" />
          </div>
        </div>

        <!-- Incidents chart -->
        <div class="rounded-lg border bg-card p-3">
          <p class="mb-2 text-xs font-semibold text-muted-foreground">Incidencias (6 meses)</p>
          <div v-if="isLoading" class="h-48">
            <Skeleton class="h-full w-full rounded-md" />
          </div>
          <div v-else class="h-48">
            <Line :data="incidentsChartData" :options="chartOpts" />
          </div>
        </div>

        <!-- Quick incident stats -->
        <div class="grid grid-cols-2 gap-2">
          <div class="flex items-center gap-2.5 rounded-lg border bg-card p-3">
            <div class="flex size-8 items-center justify-center rounded-md bg-amber-100 text-amber-600 dark:bg-amber-900/30">
              <AlertTriangle class="size-4" />
            </div>
            <div>
              <p class="text-lg font-bold leading-none">{{ stats?.openIncidents ?? 0 }}</p>
              <p class="mt-0.5 text-[11px] text-muted-foreground">Abiertas</p>
            </div>
          </div>
          <div class="flex items-center gap-2.5 rounded-lg border bg-card p-3">
            <div class="flex size-8 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30">
              <ShieldAlert class="size-4" />
            </div>
            <div>
              <p class="text-lg font-bold leading-none">{{ stats?.inProgressIncidents ?? 0 }}</p>
              <p class="mt-0.5 text-[11px] text-muted-foreground">En progreso</p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
