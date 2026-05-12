<script setup lang="ts">
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
  Camera,
} from 'lucide-vue-next'
import type { Incident, IncidentStatus, IncidentPriority } from '~~/shared/types/incident'
import { INCIDENT_STATUS_COLORS, INCIDENT_STATUS_LABELS, INCIDENT_PRIORITY_COLORS, INCIDENT_PRIORITY_LABELS } from '~/composables/useColorMap'

useHead({ title: 'Mis Incidencias' })

const { target, isMounted } = useTopbarPortal()

const { incidents, meta, isLoading, error, totalPages, fetchIncidents } = useIncidents()
const currentPage = ref(1)
const detail = useIncidentDetail()

// Sheet state
const selectedIncident = ref<Incident | null>(null)
const sheetOpen = ref(false)

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

watch(currentPage, (page) => {
  fetchIncidents({ page, mine: true })
})

onMounted(() => {
  fetchIncidents({ mine: true })
})

function openDetail(incident: Incident) {
  selectedIncident.value = incident
  sheetOpen.value = true
  detail.fetchIncident(incident.id)
}

const { formatDate, formatDateTime } = useFormatDate()
</script>

<template>
  <div>
    <!-- Topbar actions (desktop) -->
    <Teleport :to="target" defer v-if="isMounted">
      <Button size="sm" @click="navigateTo('/propietario/incidencias/nueva')">
        <Plus class="mr-1.5 size-3.5" />
        Reportar
      </Button>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" @click="navigateTo('/propietario/incidencias/nueva')">
        <Plus class="size-4" />
      </Button>
    </TopbarMobileAction>

    <!-- Error -->
    <ErrorAlert :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="3" />

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Empty state -->
      <EmptyState
        v-if="incidents.length === 0"
        :icon="AlertTriangle"
        title="No tienes incidencias"
        description="Reporta un problema y le daremos seguimiento"
      >
        <template #action>
          <Button size="sm" @click="navigateTo('/propietario/incidencias/nueva')">
            <Plus class="mr-1.5 size-3.5" />
            Reportar incidencia
          </Button>
        </template>
      </EmptyState>

      <!-- Incident cards -->
      <div v-else>
        <div class="space-y-2">
          <Card
            v-for="item in incidents"
            :key="item.id"
            class="cursor-pointer transition-colors hover:bg-muted/50"
            @click="openDetail(item)"
          >
            <CardContent class="px-3 py-2.5">
              <!-- Row 1: Title + Priority badge + Date -->
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
              <!-- Row 2: Status + separator + date -->
              <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                <span :class="STATUS_CONFIG[item.status].class.replace(/bg-\S+/g, '')" class="font-medium">
                  {{ STATUS_CONFIG[item.status].label }}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Pagination -->
        <ListPagination v-model:current-page="currentPage" :total-pages="totalPages" class="mt-4" />
      </div>
    </template>

    <!-- Detail Sheet -->
    <Sheet v-model:open="sheetOpen">
      <SheetContent side="right" class="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{{ selectedIncident?.title }}</SheetTitle>
          <SheetDescription>
            Reportada el {{ selectedIncident ? formatDate(selectedIncident.createdAt) : '' }}
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
                    alt="Foto de incidencia"
                    class="size-20 shrink-0 rounded-lg border object-cover transition-opacity hover:opacity-80"
                  />
                </a>
              </div>
            </div>

            <!-- Status history -->
            <div v-if="detail.incident.value.updates && detail.incident.value.updates.length > 0">
              <Separator class="mb-4" />
              <p class="mb-2 text-sm font-medium">Historial de cambios</p>
              <div class="space-y-2">
                <div
                  v-for="update in detail.incident.value.updates"
                  :key="update.id"
                  class="rounded-lg bg-muted/50 p-2.5"
                >
                  <div class="flex items-center gap-2">
                    <div class="size-1.5 shrink-0 rounded-lg bg-primary" />
                    <span class="text-xs font-medium">
                      {{ STATUS_CONFIG[update.oldStatus].label }} → {{ STATUS_CONFIG[update.newStatus].label }}
                    </span>
                  </div>
                  <p v-if="update.note" class="ml-3.5 mt-1 text-xs text-muted-foreground">{{ update.note }}</p>
                  <p class="ml-3.5 mt-1 text-xs text-muted-foreground">{{ formatDateTime(update.createdAt) }}</p>
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
