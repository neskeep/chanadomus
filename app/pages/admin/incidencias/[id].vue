<script setup lang="ts">
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
  Camera,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { IncidentStatus, IncidentPriority } from '~~/shared/types/incident'
import { INCIDENT_STATUS_COLORS, INCIDENT_STATUS_LABELS, INCIDENT_PRIORITY_COLORS, INCIDENT_PRIORITY_LABELS } from '~/composables/useColorMap'

const route = useRoute()
const id = route.params.id as string

const { incident, isLoading, isUpdating, error, fetchIncident, updateStatus } = useIncidentDetail()
const { formatDate, formatDateTime } = useFormatDate()

// Override page info with dynamic title
const pageOverride = computed(() => {
  if (!incident.value) return null
  return { title: incident.value.title }
})
usePageInfoOverride(pageOverride)

useHead({ title: () => incident.value?.title ?? 'Incidencia' })

// Status update form
const newStatus = ref<IncidentStatus | ''>('')
const statusNote = ref('')

const STATUS_CONFIG: Record<IncidentStatus, { label: string; class: string; icon: typeof Clock }> = {
  open: { label: INCIDENT_STATUS_LABELS.open, class: INCIDENT_STATUS_COLORS.open, icon: AlertTriangle },
  in_progress: { label: INCIDENT_STATUS_LABELS.in_progress, class: INCIDENT_STATUS_COLORS.in_progress, icon: Loader2 },
  resolved: { label: INCIDENT_STATUS_LABELS.resolved, class: INCIDENT_STATUS_COLORS.resolved, icon: CheckCircle2 },
  closed: { label: INCIDENT_STATUS_LABELS.closed, class: INCIDENT_STATUS_COLORS.closed, icon: XCircle },
}

const PRIORITY_CONFIG: Record<IncidentPriority, { label: string; class: string }> = {
  low: { label: INCIDENT_PRIORITY_LABELS.low, class: INCIDENT_PRIORITY_COLORS.low },
  medium: { label: INCIDENT_PRIORITY_LABELS.medium, class: INCIDENT_PRIORITY_COLORS.medium },
  high: { label: INCIDENT_PRIORITY_LABELS.high, class: INCIDENT_PRIORITY_COLORS.high },
}

async function handleUpdateStatus() {
  if (!newStatus.value) return
  try {
    await updateStatus(id, newStatus.value as IncidentStatus, statusNote.value || undefined)
    toast.success('Estado actualizado correctamente')
    newStatus.value = ''
    statusNote.value = ''
  }
  catch {
    toast.error(error.value ?? 'Error al actualizar estado')
  }
}

onMounted(() => {
  fetchIncident(id)
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <Skeleton class="h-8 w-3/4" />
      <Skeleton class="h-4 w-1/2" />
      <Skeleton class="h-32 w-full" />
    </div>

    <!-- Error -->
    <ErrorAlert v-else-if="error && !incident" :message="error" />

    <!-- Content -->
    <template v-else-if="incident">
      <!-- Header info -->
      <Card class="mb-4">
        <CardContent class="p-5 md:p-8">
          <div class="space-y-4">
            <!-- Status + Priority badges -->
            <div class="flex flex-wrap gap-2">
              <span
                class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium"
                :class="STATUS_CONFIG[incident.status].class"
              >
                <component :is="STATUS_CONFIG[incident.status].icon" class="size-3.5" />
                {{ STATUS_CONFIG[incident.status].label }}
              </span>
              <span
                class="inline-flex rounded-lg px-2.5 py-1 text-xs font-medium"
                :class="PRIORITY_CONFIG[incident.priority].class"
              >
                {{ PRIORITY_CONFIG[incident.priority].label }}
              </span>
            </div>

            <!-- Meta: unit + reporter + date -->
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span v-if="incident.unitNumber">Unidad {{ incident.unitNumber }}</span>
              <span v-if="incident.reportedByName">Reportado por {{ incident.reportedByName }}</span>
              <span class="tabular-nums">{{ formatDate(incident.createdAt) }}</span>
            </div>

            <!-- Description -->
            <p class="text-base leading-relaxed">{{ incident.description }}</p>

            <!-- Photos -->
            <div v-if="incident.photos && incident.photos.length > 0">
              <p class="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Camera class="size-4" />
                Fotos adjuntas
              </p>
              <div class="flex gap-3 overflow-x-auto pb-1">
                <a
                  v-for="photo in incident.photos"
                  :key="photo.id"
                  :href="`/api/incidents/photos/${photo.filePath}`"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    :src="`/api/incidents/photos/${photo.filePath}`"
                    alt="Foto de incidencia"
                    class="size-28 shrink-0 rounded-lg border object-cover transition-opacity hover:opacity-80"
                  />
                </a>
              </div>
            </div>

            <!-- Dates -->
            <div class="text-sm text-muted-foreground">
              <p>Creada: {{ formatDate(incident.createdAt) }}</p>
              <p v-if="incident.resolvedAt">Resuelta: {{ formatDate(incident.resolvedAt) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Status update form -->
      <Card class="mb-4">
        <CardContent class="p-5 md:p-8">
          <form class="space-y-4" @submit.prevent="handleUpdateStatus">
            <p class="text-base font-semibold">Cambiar estado</p>

            <div class="space-y-1.5">
              <Label for="new-status">Nuevo estado</Label>
              <Select v-model="newStatus">
                <SelectTrigger id="new-status" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar nuevo estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abierta</SelectItem>
                  <SelectItem value="in_progress">En proceso</SelectItem>
                  <SelectItem value="resolved">Resuelta</SelectItem>
                  <SelectItem value="closed">Cerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5">
              <Label for="status-note">Nota interna</Label>
              <Textarea
                id="status-note"
                v-model="statusNote"
                placeholder="Nota interna (opcional)"
                rows="2"
                class="text-base"
              />
            </div>

            <Button
              type="submit"
              class="h-12 w-full text-base font-semibold"
              :disabled="!newStatus || isUpdating"
            >
              <Loader2 v-if="isUpdating" class="mr-2 size-4 animate-spin" />
              {{ isUpdating ? 'Actualizando...' : 'Actualizar estado' }}
            </Button>
          </form>
        </CardContent>
      </Card>

      <!-- Status history -->
      <Card v-if="incident.updates && incident.updates.length > 0">
        <CardContent class="p-5 md:p-8">
          <p class="mb-4 text-base font-semibold">Historial de cambios</p>
          <div class="space-y-3">
            <div
              v-for="update in incident.updates"
              :key="update.id"
              class="rounded-lg bg-muted/50 p-3"
            >
              <div class="flex items-center gap-2">
                <div class="size-2 shrink-0 rounded-lg bg-primary" />
                <span class="text-sm font-medium">
                  {{ STATUS_CONFIG[update.oldStatus].label }} → {{ STATUS_CONFIG[update.newStatus].label }}
                </span>
              </div>
              <p v-if="update.note" class="ml-4 mt-1 text-sm text-muted-foreground">{{ update.note }}</p>
              <p class="ml-4 mt-1 text-xs text-muted-foreground">
                {{ update.updatedByName ?? 'Admin' }} · {{ formatDateTime(update.createdAt) }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
