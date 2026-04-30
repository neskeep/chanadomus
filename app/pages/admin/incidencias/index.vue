<script setup lang="ts">
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-vue-next'
import type { IncidentStatus, IncidentPriority } from '~~/shared/types/incident'
import { INCIDENT_STATUS_COLORS, INCIDENT_STATUS_LABELS, INCIDENT_PRIORITY_COLORS, INCIDENT_PRIORITY_LABELS } from '~/composables/useColorMap'

useHead({ title: 'Gestion de Incidencias' })

const { incidents, meta, isLoading, error, totalPages, fetchIncidents } = useIncidents()

const { target, isMounted } = useTopbarPortal()

const currentPage = ref(1)
const searchQuery = ref('')
const filterStatus = ref<IncidentStatus | ''>('')
const filterPriority = ref<IncidentPriority | ''>('')

const statusOptions = [
  { value: 'open', label: 'Abierta' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'resolved', label: 'Resuelta' },
  { value: 'closed', label: 'Cerrada' },
]
const priorityOptions = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
]

const STATUS_CONFIG: Record<IncidentStatus, { label: string, class: string, icon: typeof Clock }> = {
  open: { label: INCIDENT_STATUS_LABELS.open, class: INCIDENT_STATUS_COLORS.open, icon: AlertTriangle },
  in_progress: { label: INCIDENT_STATUS_LABELS.in_progress, class: INCIDENT_STATUS_COLORS.in_progress, icon: Loader2 },
  resolved: { label: INCIDENT_STATUS_LABELS.resolved, class: INCIDENT_STATUS_COLORS.resolved, icon: CheckCircle2 },
  closed: { label: INCIDENT_STATUS_LABELS.closed, class: INCIDENT_STATUS_COLORS.closed, icon: XCircle },
}

const PRIORITY_CONFIG: Record<IncidentPriority, { label: string, class: string }> = {
  low: { label: INCIDENT_PRIORITY_LABELS.low, class: INCIDENT_PRIORITY_COLORS.low },
  medium: { label: INCIDENT_PRIORITY_LABELS.medium, class: INCIDENT_PRIORITY_COLORS.medium },
  high: { label: INCIDENT_PRIORITY_LABELS.high, class: INCIDENT_PRIORITY_COLORS.high },
}

// Stats
const totalOpen = computed(() => incidents.value.filter(i => i.status === 'open').length)
const totalInProgress = computed(() => incidents.value.filter(i => i.status === 'in_progress').length)

async function loadIncidents() {
  const params: Record<string, unknown> = { page: currentPage.value }
  if (filterStatus.value) params.status = filterStatus.value
  if (filterPriority.value) params.priority = filterPriority.value
  await fetchIncidents(params as Parameters<typeof fetchIncidents>[0])
}

watch([currentPage, filterStatus, filterPriority], () => {
  loadIncidents()
})

onMounted(() => {
  loadIncidents()
})

// Filtered by search (client-side, on top of server filters)
const filteredIncidents = computed(() => {
  if (!searchQuery.value.trim()) return incidents.value
  const q = searchQuery.value.trim().toLowerCase()
  return incidents.value.filter(i =>
    i.title.toLowerCase().includes(q)
    || i.unitNumber?.toLowerCase().includes(q)
    || i.reportedByName?.toLowerCase().includes(q),
  )
})

const { formatDate } = useFormatDate()
</script>

<template>
  <div>
    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-3">
      <StatCard
        label="Abiertas"
        :value="totalOpen"
        :icon="AlertTriangle"
        icon-bg-class="bg-secondary/10 text-secondary"
        :is-loading="isLoading"
      />
      <StatCard
        label="En proceso"
        :value="totalInProgress"
        :icon="Clock"
        icon-bg-class="bg-primary/10 text-primary"
        :is-loading="isLoading"
      />
    </div>

    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <Teleport :to="target" defer v-if="isMounted">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar incidencia...">
        <TopbarFilters :active="filterStatus !== '' || filterPriority !== ''" @clear="filterStatus = ''; filterPriority = ''">
          <TopbarFilterGroup v-model="filterStatus" label="Estado" :options="statusOptions" />
          <TopbarFilterGroup v-model="filterPriority" label="Prioridad" :options="priorityOptions" />
        </TopbarFilters>
      </TopbarSearch>
    </Teleport>

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="5" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="filteredIncidents.length === 0"
      :icon="AlertTriangle"
      title="No hay incidencias"
      :description="filterStatus || filterPriority ? 'Prueba cambiando los filtros' : 'Los reportes de propietarios aparecerán aquí'"
    />

    <!-- Table (desktop) / Cards (mobile) -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidad</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Reportado por</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="item in filteredIncidents"
              :key="item.id"
            >
              <TableCell class="font-medium">{{ item.unitNumber ?? '—' }}</TableCell>
              <TableCell class="max-w-[200px]">
                <NuxtLink :to="`/admin/incidencias/${item.id}`" class="truncate font-medium text-primary underline-offset-2 hover:underline">
                  {{ item.title }}
                </NuxtLink>
              </TableCell>
              <TableCell class="text-muted-foreground">{{ item.reportedByName ?? '—' }}</TableCell>
              <TableCell>
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                  :class="PRIORITY_CONFIG[item.priority].class"
                >
                  {{ PRIORITY_CONFIG[item.priority].label }}
                </span>
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium"
                  :class="STATUS_CONFIG[item.status].class"
                >
                  <component :is="STATUS_CONFIG[item.status].icon" class="size-3" />
                  {{ STATUS_CONFIG[item.status].label }}
                </span>
              </TableCell>
              <TableCell class="text-muted-foreground">{{ formatDate(item.createdAt) }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile cards -->
      <div class="space-y-2 md:hidden">
        <NuxtLink v-for="item in filteredIncidents" :key="item.id" :to="`/admin/incidencias/${item.id}`">
          <Card class="transition-colors hover:bg-muted/50">
            <CardContent class="px-3 py-2.5">
              <!-- Row 1: Title + Priority + Date -->
              <div class="flex items-center gap-1.5">
                <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ item.title }}</p>
                <span
                  class="inline-flex shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                  :class="PRIORITY_CONFIG[item.priority].class"
                >
                  {{ PRIORITY_CONFIG[item.priority].label }}
                </span>
                <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">{{ formatDate(item.createdAt) }}</span>
              </div>
              <!-- Row 2: Status · Unit · Reporter -->
              <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                <span :class="STATUS_CONFIG[item.status].class.replace(/bg-\S+/g, '')" class="font-medium">
                  {{ STATUS_CONFIG[item.status].label }}
                </span>
                <span class="opacity-30">·</span>
                <span class="shrink-0">{{ item.unitNumber ?? '—' }}</span>
                <span class="opacity-30">·</span>
                <span class="truncate">{{ item.reportedByName ?? '—' }}</span>
              </div>
            </CardContent>
          </Card>
        </NuxtLink>
      </div>

      <!-- Pagination -->
      <ListPagination v-model:current-page="currentPage" :total-pages="totalPages" class="mt-4" />
    </div>
  </div>
</template>
