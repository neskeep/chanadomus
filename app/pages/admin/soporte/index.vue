<script setup lang="ts">
import {
  Circle,
  Eye,
  Code2,
  CheckCircle2,
  XCircle,
} from 'lucide-vue-next'
import type { SupportTicketStatus, SupportTicketPriority, SupportTicketType } from '~~/shared/types/support'
import {
  SUPPORT_STATUS_COLORS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_PRIORITY_COLORS,
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_TYPE_COLORS,
  SUPPORT_TYPE_LABELS,
} from '~/composables/useColorMap'

useHead({ title: 'Gestión de Soporte' })

const { tickets, isLoading, error, totalPages, fetchTickets } = useSupportTickets()

const { target, isMounted } = useTopbarPortal()

const currentPage = ref(1)
const searchQuery = ref('')
const filterStatus = ref<SupportTicketStatus | ''>('')
const filterType = ref<SupportTicketType | ''>('')
const filterPriority = ref<SupportTicketPriority | ''>('')

const statusOptions = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'en_desarrollo', label: 'En desarrollo' },
  { value: 'resuelto', label: 'Resuelto' },
  { value: 'cerrado', label: 'Cerrado' },
]
const typeOptions = [
  { value: 'bug', label: 'Bug' },
  { value: 'sugerencia', label: 'Sugerencia' },
  { value: 'pregunta', label: 'Pregunta' },
]
const priorityOptions = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
]

const STATUS_CONFIG: Record<SupportTicketStatus, { label: string; class: string; icon: typeof Circle }> = {
  nuevo: { label: SUPPORT_STATUS_LABELS.nuevo, class: SUPPORT_STATUS_COLORS.nuevo, icon: Circle },
  en_revision: { label: SUPPORT_STATUS_LABELS.en_revision, class: SUPPORT_STATUS_COLORS.en_revision, icon: Eye },
  en_desarrollo: { label: SUPPORT_STATUS_LABELS.en_desarrollo, class: SUPPORT_STATUS_COLORS.en_desarrollo, icon: Code2 },
  resuelto: { label: SUPPORT_STATUS_LABELS.resuelto, class: SUPPORT_STATUS_COLORS.resuelto, icon: CheckCircle2 },
  cerrado: { label: SUPPORT_STATUS_LABELS.cerrado, class: SUPPORT_STATUS_COLORS.cerrado, icon: XCircle },
}

const PRIORITY_CONFIG: Record<SupportTicketPriority, { label: string; class: string }> = {
  baja: { label: SUPPORT_PRIORITY_LABELS.baja, class: SUPPORT_PRIORITY_COLORS.baja },
  media: { label: SUPPORT_PRIORITY_LABELS.media, class: SUPPORT_PRIORITY_COLORS.media },
  alta: { label: SUPPORT_PRIORITY_LABELS.alta, class: SUPPORT_PRIORITY_COLORS.alta },
  critica: { label: SUPPORT_PRIORITY_LABELS.critica, class: SUPPORT_PRIORITY_COLORS.critica },
}

const TYPE_CONFIG: Record<SupportTicketType, { label: string; class: string }> = {
  bug: { label: SUPPORT_TYPE_LABELS.bug, class: SUPPORT_TYPE_COLORS.bug },
  sugerencia: { label: SUPPORT_TYPE_LABELS.sugerencia, class: SUPPORT_TYPE_COLORS.sugerencia },
  pregunta: { label: SUPPORT_TYPE_LABELS.pregunta, class: SUPPORT_TYPE_COLORS.pregunta },
}

// Stats
const totalNuevos = computed(() => tickets.value.filter(t => t.status === 'nuevo').length)
const totalEnRevision = computed(() => tickets.value.filter(t => t.status === 'en_revision').length)

async function loadTickets() {
  const params: Record<string, unknown> = { page: currentPage.value }
  if (filterStatus.value) params.status = filterStatus.value
  if (filterType.value) params.type = filterType.value
  if (filterPriority.value) params.priority = filterPriority.value
  await fetchTickets(params as Parameters<typeof fetchTickets>[0])
}

watch([currentPage, filterStatus, filterType, filterPriority], () => {
  loadTickets()
})

onMounted(() => {
  loadTickets()
})

// Filtered by search (client-side, on top of server filters)
const filteredTickets = computed(() => {
  if (!searchQuery.value.trim()) return tickets.value
  const q = searchQuery.value.trim().toLowerCase()
  return tickets.value.filter(t =>
    t.title.toLowerCase().includes(q)
    || t.reportedByName?.toLowerCase().includes(q),
  )
})

const { formatDate } = useFormatDate()
</script>

<template>
  <div>
    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-3">
      <StatCard
        label="Nuevos"
        :value="totalNuevos"
        :icon="Circle"
        icon-bg-class="bg-blue-100 text-blue-800"
        :is-loading="isLoading"
      />
      <StatCard
        label="En revisión"
        :value="totalEnRevision"
        :icon="Eye"
        icon-bg-class="bg-amber-100 text-amber-800"
        :is-loading="isLoading"
      />
    </div>

    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <Teleport v-if="isMounted" :to="target" defer>
      <TopbarSearch v-model="searchQuery" placeholder="Buscar ticket...">
        <TopbarFilters :active="filterStatus !== '' || filterType !== '' || filterPriority !== ''" @clear="filterStatus = ''; filterType = ''; filterPriority = ''">
          <TopbarFilterGroup v-model="filterStatus" label="Estado" :options="statusOptions" />
          <TopbarFilterGroup v-model="filterType" label="Tipo" :options="typeOptions" />
          <TopbarFilterGroup v-model="filterPriority" label="Prioridad" :options="priorityOptions" />
        </TopbarFilters>
      </TopbarSearch>
    </Teleport>

    <!-- Mobile search -->
    <div class="mb-4 md:hidden">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar ticket...">
        <TopbarFilters :active="filterStatus !== '' || filterType !== '' || filterPriority !== ''" @clear="filterStatus = ''; filterType = ''; filterPriority = ''">
          <TopbarFilterGroup v-model="filterStatus" label="Estado" :options="statusOptions" />
          <TopbarFilterGroup v-model="filterType" label="Tipo" :options="typeOptions" />
          <TopbarFilterGroup v-model="filterPriority" label="Prioridad" :options="priorityOptions" />
        </TopbarFilters>
      </TopbarSearch>
    </div>

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="5" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="filteredTickets.length === 0"
      :icon="Circle"
      title="No hay tickets"
      :description="filterStatus || filterType || filterPriority ? 'Prueba cambiando los filtros' : 'Los reportes de soporte aparecerán aquí'"
    />

    <!-- Table (desktop) / Cards (mobile) -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Reportado por</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="item in filteredTickets"
              :key="item.id"
            >
              <TableCell class="max-w-[200px]">
                <NuxtLink :to="`/admin/soporte/${item.id}`" class="block truncate font-medium text-primary underline-offset-2 hover:underline">
                  {{ item.title }}
                </NuxtLink>
              </TableCell>
              <TableCell class="text-muted-foreground">
                {{ item.reportedByName ?? '—' }}
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                  :class="TYPE_CONFIG[item.type].class"
                >
                  {{ TYPE_CONFIG[item.type].label }}
                </span>
              </TableCell>
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
        <NuxtLink v-for="item in filteredTickets" :key="item.id" :to="`/admin/soporte/${item.id}`">
          <Card class="transition-colors hover:bg-muted/50">
            <CardContent class="px-3 py-2.5">
              <!-- Row 1: Title + Type badge + Date -->
              <div class="flex items-center gap-1.5">
                <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ item.title }}</p>
                <span
                  class="inline-flex shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                  :class="TYPE_CONFIG[item.type].class"
                >
                  {{ TYPE_CONFIG[item.type].label }}
                </span>
                <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">{{ formatDate(item.createdAt) }}</span>
              </div>
              <!-- Row 2: Status + Reporter -->
              <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                <span :class="STATUS_CONFIG[item.status].class.replace(/bg-\S+/g, '')" class="font-medium">
                  {{ STATUS_CONFIG[item.status].label }}
                </span>
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
