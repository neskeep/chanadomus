<script setup lang="ts">
import {
  AlertTriangle,
  Calendar,
  Download,
  FileText,
  ShieldAlert,
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
      <TabsContent value="resumen" class="mt-3 space-y-3">
        <!-- Next meeting (most time-sensitive first) -->
        <div v-if="stats?.nextMeeting" class="flex items-center gap-2.5 rounded-lg border bg-card p-3">
          <div class="flex size-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
            <Calendar class="size-4" />
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">{{ stats.nextMeeting.title }}</p>
            <p class="text-xs text-muted-foreground">{{ formatDate(stats.nextMeeting.date) }}</p>
          </div>
        </div>

        <!-- Operaciones -->
        <div class="space-y-1.5">
          <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Operaciones</p>
          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-lg border bg-card p-3">
              <p class="text-xs text-muted-foreground">Incidencias abiertas</p>
              <p v-if="isLoading"><Skeleton class="mt-1 h-6 w-8" /></p>
              <p v-else class="mt-1 text-lg font-bold" :class="(stats?.openIncidents ?? 0) > 0 ? 'text-amber-600' : ''">
                {{ stats?.openIncidents ?? 0 }}
              </p>
            </div>
            <div class="rounded-lg border bg-card p-3">
              <p class="text-xs text-muted-foreground">En progreso</p>
              <p v-if="isLoading"><Skeleton class="mt-1 h-6 w-8" /></p>
              <p v-else class="mt-1 text-lg font-bold" :class="(stats?.inProgressIncidents ?? 0) > 0 ? 'text-blue-600' : ''">
                {{ stats?.inProgressIncidents ?? 0 }}
              </p>
            </div>
          </div>
        </div>

        <Separator class="opacity-40" />

        <!-- Comunidad -->
        <div class="space-y-1.5">
          <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Comunidad</p>
          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-lg border bg-card p-3">
              <p class="text-xs text-muted-foreground">Votaciones activas</p>
              <p v-if="isLoading"><Skeleton class="mt-1 h-6 w-8" /></p>
              <p v-else class="mt-1 text-lg font-bold" :class="(stats?.activePolls ?? 0) > 0 ? 'text-purple-600' : ''">
                {{ stats?.activePolls ?? 0 }}
              </p>
            </div>
            <div class="rounded-lg border bg-card p-3">
              <p class="text-xs text-muted-foreground">Reuniones proximas</p>
              <p v-if="isLoading"><Skeleton class="mt-1 h-6 w-8" /></p>
              <p v-else class="mt-1 text-lg font-bold">{{ stats?.upcomingMeetings ?? 0 }}</p>
            </div>
          </div>
        </div>

        <Separator class="opacity-40" />

        <!-- Condominio -->
        <div class="space-y-1.5">
          <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Condominio</p>
          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-lg border bg-card p-3">
              <p class="text-xs text-muted-foreground">Unidades</p>
              <p v-if="isLoading"><Skeleton class="mt-1 h-6 w-8" /></p>
              <p v-else class="mt-1 text-lg font-bold">{{ stats?.totalUnits ?? 0 }}</p>
            </div>
            <div class="rounded-lg border bg-card p-3">
              <p class="text-xs text-muted-foreground">En mora</p>
              <p v-if="isLoading"><Skeleton class="mt-1 h-6 w-8" /></p>
              <p v-else class="mt-1 text-lg font-bold" :class="(stats?.unitsInDebt ?? 0) > 0 ? 'text-destructive' : ''">
                {{ stats?.unitsInDebt ?? 0 }}
              </p>
            </div>
          </div>
        </div>

        <Separator class="opacity-40" />

        <!-- Finance snapshot -->
        <div class="space-y-1.5">
          <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Finanzas del mes</p>
          <div class="grid grid-cols-3 gap-2">
          <div class="rounded-lg border bg-card p-3">
            <p class="text-xs text-muted-foreground">Cobrado</p>
            <p v-if="isLoading"><Skeleton class="mt-1 h-5 w-14" /></p>
            <p v-else class="mt-1 text-sm font-bold text-emerald-600">
              {{ trends?.financialKpis ? formatCurrency(trends.financialKpis.totalAbonos) : '—' }}
            </p>
          </div>
          <div class="rounded-lg border bg-card p-3">
            <p class="text-xs text-muted-foreground">Pendiente</p>
            <p v-if="isLoading"><Skeleton class="mt-1 h-5 w-14" /></p>
            <p v-else class="mt-1 text-sm font-bold" :class="(trends?.financialKpis?.pendingBalance ?? 0) > 0 ? 'text-destructive' : ''">
              {{ trends?.financialKpis ? formatCurrency(trends.financialKpis.pendingBalance) : '—' }}
            </p>
          </div>
          <div class="rounded-lg border bg-card p-3">
            <p class="text-xs text-muted-foreground">Cobranza</p>
            <p v-if="isLoading"><Skeleton class="mt-1 h-5 w-14" /></p>
            <p v-else class="mt-1 text-sm font-bold text-blue-600">
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
            <p class="text-xs text-muted-foreground">Cobrado este mes</p>
            <p v-if="isLoading"><Skeleton class="mt-1 h-6 w-24" /></p>
            <p v-else class="mt-1 text-lg font-bold text-emerald-600">
              {{ trends?.financialKpis ? formatCurrency(trends.financialKpis.totalAbonos) : '—' }}
            </p>
          </div>
          <div class="rounded-lg border bg-card p-3">
            <p class="text-xs text-muted-foreground">Cargos este mes</p>
            <p v-if="isLoading"><Skeleton class="mt-1 h-6 w-24" /></p>
            <p v-else class="mt-1 text-lg font-bold">
              {{ trends?.financialKpis ? formatCurrency(trends.financialKpis.totalCargos) : '—' }}
            </p>
          </div>
          <div class="rounded-lg border bg-card p-3">
            <p class="text-xs text-muted-foreground">Pendiente total</p>
            <p v-if="isLoading"><Skeleton class="mt-1 h-6 w-24" /></p>
            <p v-else class="mt-1 text-lg font-bold" :class="(trends?.financialKpis?.pendingBalance ?? 0) > 0 ? 'text-destructive' : ''">
              {{ trends?.financialKpis ? formatCurrency(trends.financialKpis.pendingBalance) : '—' }}
            </p>
          </div>
          <div class="rounded-lg border bg-card p-3">
            <p class="text-xs text-muted-foreground">Tasa de cobranza</p>
            <p v-if="isLoading"><Skeleton class="mt-1 h-6 w-24" /></p>
            <p v-else class="mt-1 text-lg font-bold text-blue-600">
              {{ trends?.financialKpis ? `${trends.financialKpis.collectionRate.toFixed(1)}%` : '—' }}
            </p>
          </div>
        </div>

        <!-- Unidades en mora badge -->
        <div class="flex items-center gap-2 rounded-lg border bg-card p-3">
          <div class="flex size-8 items-center justify-center rounded-md bg-red-100 text-red-600">
            <Wallet class="size-4" />
          </div>
          <div>
            <p class="text-sm font-semibold">{{ stats?.unitsInDebt ?? 0 }} {{ (stats?.unitsInDebt ?? 0) === 1 ? 'unidad' : 'unidades' }} en mora</p>
            <p class="text-xs text-muted-foreground">de {{ stats?.totalUnits ?? 0 }} totales</p>
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
            <div class="flex size-8 items-center justify-center rounded-md bg-amber-100 text-amber-600">
              <AlertTriangle class="size-4" />
            </div>
            <div>
              <p class="text-lg font-bold leading-none">{{ stats?.openIncidents ?? 0 }}</p>
              <p class="mt-0.5 text-xs text-muted-foreground">Abiertas</p>
            </div>
          </div>
          <div class="flex items-center gap-2.5 rounded-lg border bg-card p-3">
            <div class="flex size-8 items-center justify-center rounded-md bg-blue-100 text-blue-600">
              <ShieldAlert class="size-4" />
            </div>
            <div>
              <p class="text-lg font-bold leading-none">{{ stats?.inProgressIncidents ?? 0 }}</p>
              <p class="mt-0.5 text-xs text-muted-foreground">En progreso</p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
