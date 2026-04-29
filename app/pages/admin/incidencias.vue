<script setup lang="ts">
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Camera,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Incident, IncidentStatus, IncidentPriority } from '~~/shared/types/incident'
import { INCIDENT_STATUS_COLORS, INCIDENT_STATUS_LABELS, INCIDENT_PRIORITY_COLORS, INCIDENT_PRIORITY_LABELS } from '~/composables/useColorMap'

useHead({ title: 'Gestion de Incidencias' })

const { incidents, meta, isLoading, error, totalPages, fetchIncidents } = useIncidents()
const detail = useIncidentDetail()

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

// Dialog state
const selectedIncident = ref<Incident | null>(null)
const dialogOpen = ref(false)
const newStatus = ref<IncidentStatus | ''>('')
const statusNote = ref('')

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

function openDetail(incident: Incident) {
  selectedIncident.value = incident
  newStatus.value = ''
  statusNote.value = ''
  dialogOpen.value = true
  detail.fetchIncident(incident.id)
}

async function handleUpdateStatus() {
  if (!selectedIncident.value || !newStatus.value) return

  try {
    await detail.updateStatus(selectedIncident.value.id, newStatus.value as IncidentStatus, statusNote.value || undefined)
    toast.success('Estado actualizado correctamente')
    dialogOpen.value = false
    await loadIncidents()
  }
  catch {
    toast.error(detail.error.value ?? 'Error al actualizar estado')
  }
}

const { formatDate, formatDateTime } = useFormatDate()
</script>

<template>
  <div>
    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-3">
      <div class="flex items-center gap-3 rounded-lg border bg-card p-4">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-amber-100">
          <AlertTriangle class="size-5 text-amber-600" />
        </div>
        <div>
          <p v-if="isLoading"><Skeleton class="h-5 w-8" /></p>
          <p v-else class="text-lg font-bold leading-none">{{ totalOpen }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">Abiertas</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-lg border bg-card p-4">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-blue-100">
          <Clock class="size-5 text-blue-600" />
        </div>
        <div>
          <p v-if="isLoading"><Skeleton class="h-5 w-8" /></p>
          <p v-else class="text-lg font-bold leading-none">{{ totalInProgress }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">En proceso</p>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <Teleport :to="target" defer v-if="isMounted">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar incidencia...">
        <TopbarFilters :active="filterStatus !== '' || filterPriority !== ''" @clear="filterStatus = ''; filterPriority = ''">
          <TopbarFilterGroup v-model="filterStatus" label="Estado" :options="statusOptions" />
          <TopbarFilterGroup v-model="filterPriority" label="Prioridad" :options="priorityOptions" />
        </TopbarFilters>
      </TopbarSearch>
    </Teleport>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-2">
      <Skeleton v-for="i in 5" :key="i" class="h-16 w-full rounded-lg" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredIncidents.length === 0"
      class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
    >
      <div class="flex size-12 items-center justify-center rounded-full bg-muted">
        <AlertTriangle class="size-6 text-muted-foreground" />
      </div>
      <div>
        <p class="font-medium">No hay incidencias</p>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ filterStatus || filterPriority ? 'Prueba cambiando los filtros' : 'Los reportes de propietarios aparecerán aquí' }}
        </p>
      </div>
    </div>

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
              class="cursor-pointer"
              @click="openDetail(item)"
            >
              <TableCell class="font-medium">{{ item.unitNumber ?? '—' }}</TableCell>
              <TableCell class="max-w-[200px] truncate">{{ item.title }}</TableCell>
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
      <div class="space-y-3 md:hidden">
        <Card
          v-for="item in filteredIncidents"
          :key="item.id"
          class="cursor-pointer transition-shadow hover:shadow-md"
          @click="openDetail(item)"
        >
          <CardContent class="p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium leading-snug">{{ item.title }}</p>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ item.unitNumber ?? '—' }} · {{ item.reportedByName ?? '—' }}
                </p>
              </div>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                class="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium"
                :class="STATUS_CONFIG[item.status].class"
              >
                <component :is="STATUS_CONFIG[item.status].icon" class="size-3" />
                {{ STATUS_CONFIG[item.status].label }}
              </span>
              <span
                class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                :class="PRIORITY_CONFIG[item.priority].class"
              >
                {{ PRIORITY_CONFIG[item.priority].label }}
              </span>
              <span class="text-xs text-muted-foreground">{{ formatDate(item.createdAt) }}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between">
        <Button
          variant="outline"
          :disabled="currentPage <= 1"
          @click="currentPage--"
        >
          <ChevronLeft class="mr-1 size-4" />
          Anterior
        </Button>
        <span class="text-sm text-muted-foreground">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <Button
          variant="outline"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          Siguiente
          <ChevronRight class="ml-1 size-4" />
        </Button>
      </div>
    </div>

    <!-- Detail Sheet -->
    <Sheet v-model:open="dialogOpen">
      <SheetContent side="right" class="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{{ selectedIncident?.title }}</SheetTitle>
          <SheetDescription>
            {{ selectedIncident?.unitNumber ?? '—' }} · {{ selectedIncident?.reportedByName ?? '—' }}
          </SheetDescription>
        </SheetHeader>

        <div v-if="detail.isLoading.value" class="space-y-3 py-4">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-3/4" />
          <Skeleton class="h-20 w-full" />
        </div>

        <template v-else-if="detail.incident.value">
          <div class="space-y-4 py-2">
            <!-- Current status & priority -->
            <div class="flex gap-2">
              <span
                class="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium"
                :class="STATUS_CONFIG[detail.incident.value.status].class"
              >
                <component :is="STATUS_CONFIG[detail.incident.value.status].icon" class="size-3" />
                {{ STATUS_CONFIG[detail.incident.value.status].label }}
              </span>
              <span
                class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                :class="PRIORITY_CONFIG[detail.incident.value.priority].class"
              >
                {{ PRIORITY_CONFIG[detail.incident.value.priority].label }}
              </span>
            </div>

            <!-- Description -->
            <p class="text-sm text-muted-foreground">{{ detail.incident.value.description }}</p>

            <!-- Photos -->
            <div v-if="detail.incident.value.photos && detail.incident.value.photos.length > 0">
              <p class="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Camera class="size-3" />
                Fotos adjuntas
              </p>
              <div class="flex gap-2 overflow-x-auto">
                <a
                  v-for="photo in detail.incident.value.photos"
                  :key="photo.id"
                  :href="`/api/incidents/photos/${photo.filePath}`"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    :src="`/api/incidents/photos/${photo.filePath}`"
                    :alt="`Foto de incidencia`"
                    class="size-24 shrink-0 rounded-lg border object-cover transition-opacity hover:opacity-80"
                  />
                </a>
              </div>
            </div>

            <Separator />

            <!-- Update status form -->
            <div class="space-y-3">
              <p class="text-sm font-medium">Cambiar estado</p>
              <Select v-model="newStatus">
                <SelectTrigger class="h-12">
                  <SelectValue placeholder="Seleccionar nuevo estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abierta</SelectItem>
                  <SelectItem value="in_progress">En proceso</SelectItem>
                  <SelectItem value="resolved">Resuelta</SelectItem>
                  <SelectItem value="closed">Cerrada</SelectItem>
                </SelectContent>
              </Select>

              <Textarea
                v-model="statusNote"
                placeholder="Nota interna (opcional)"
                rows="2"
              />

              <Button
                class="h-12 w-full"
                :disabled="!newStatus || detail.isUpdating.value"
                @click="handleUpdateStatus"
              >
                <Loader2 v-if="detail.isUpdating.value" class="mr-2 size-4 animate-spin" />
                {{ detail.isUpdating.value ? 'Actualizando...' : 'Actualizar estado' }}
              </Button>
            </div>

            <!-- Status history -->
            <div v-if="detail.incident.value.updates && detail.incident.value.updates.length > 0">
              <Separator class="mb-4" />
              <p class="mb-2 text-sm font-medium">Historial de cambios</p>
              <div class="space-y-2">
                <div
                  v-for="update in detail.incident.value.updates"
                  :key="update.id"
                  class="rounded-md bg-muted/50 p-2.5"
                >
                  <div class="flex items-center gap-2">
                    <div class="size-1.5 shrink-0 rounded-full bg-primary" />
                    <span class="text-xs font-medium">
                      {{ STATUS_CONFIG[update.oldStatus].label }} → {{ STATUS_CONFIG[update.newStatus].label }}
                    </span>
                  </div>
                  <p v-if="update.note" class="ml-3.5 mt-1 text-xs text-muted-foreground">{{ update.note }}</p>
                  <p class="ml-3.5 mt-1 text-xs text-muted-foreground">
                    {{ update.updatedByName ?? 'Admin' }} · {{ formatDateTime(update.createdAt) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Dates -->
            <div class="text-xs text-muted-foreground">
              <p>Creada: {{ formatDate(detail.incident.value.createdAt) }}</p>
              <p v-if="detail.incident.value.resolvedAt">
                Resuelta: {{ formatDate(detail.incident.value.resolvedAt) }}
              </p>
            </div>
          </div>
        </template>
      </SheetContent>
    </Sheet>
  </div>
</template>
