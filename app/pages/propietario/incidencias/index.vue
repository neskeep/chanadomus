<script setup lang="ts">
import {
  AlertTriangle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
  Camera,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next'
import { buttonVariants } from '~/components/ui/button'
import type { Incident, IncidentStatus, IncidentPriority } from '~~/shared/types/incident'

useHead({ title: 'Mis Incidencias' })

const { incidents, meta, isLoading, error, totalPages, fetchIncidents } = useIncidents()
const currentPage = ref(1)
const expandedId = ref<string | null>(null)
const detail = useIncidentDetail()

const STATUS_CONFIG: Record<IncidentStatus, { label: string, class: string, icon: typeof Clock }> = {
  open: { label: 'Abierta', class: 'bg-amber-100 text-amber-800', icon: AlertTriangle },
  in_progress: { label: 'En proceso', class: 'bg-blue-100 text-blue-800', icon: Loader2 },
  resolved: { label: 'Resuelta', class: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  closed: { label: 'Cerrada', class: 'bg-zinc-100 text-zinc-600', icon: XCircle },
}

const PRIORITY_CONFIG: Record<IncidentPriority, { label: string, class: string }> = {
  low: { label: 'Baja', class: 'bg-zinc-100 text-zinc-600' },
  medium: { label: 'Media', class: 'bg-amber-100 text-amber-700' },
  high: { label: 'Alta', class: 'bg-red-100 text-red-700' },
}

watch(currentPage, (page) => {
  fetchIncidents({ page, mine: true })
})

onMounted(() => {
  fetchIncidents({ mine: true })
})

function toggleDetail(incident: Incident) {
  if (expandedId.value === incident.id) {
    expandedId.value = null
  } else {
    expandedId.value = incident.id
    detail.fetchIncident(incident.id)
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-VE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="mx-auto max-w-lg">
    <!-- Header -->
    <div class="mb-6 flex justify-end">
      <NuxtLink to="/propietario/incidencias/nueva" :class="buttonVariants({ size: 'sm' })">
        <Plus class="mr-1.5 size-4" />
        Reportar
      </NuxtLink>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3">
      <Card v-for="i in 3" :key="i">
        <CardContent class="p-4">
          <div class="space-y-3">
            <Skeleton class="h-4 w-3/4" />
            <div class="flex gap-2">
              <Skeleton class="h-5 w-16 rounded-full" />
              <Skeleton class="h-5 w-20 rounded-full" />
            </div>
            <Skeleton class="h-3 w-28" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Empty state -->
      <div
        v-if="incidents.length === 0"
        class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
      >
        <div class="flex size-12 items-center justify-center rounded-full bg-muted">
          <AlertTriangle class="size-6 text-muted-foreground" />
        </div>
        <div>
          <p class="font-medium">No tienes incidencias</p>
          <p class="mt-1 text-sm text-muted-foreground">Reporta un problema y le daremos seguimiento</p>
        </div>
        <NuxtLink to="/propietario/incidencias/nueva" :class="buttonVariants({ size: 'sm' })">
          <Plus class="mr-1.5 size-4" />
          Reportar incidencia
        </NuxtLink>
      </div>

      <!-- Incident cards -->
      <div v-else class="space-y-3">
        <Card
          v-for="item in incidents"
          :key="item.id"
          class="cursor-pointer transition-shadow hover:shadow-md"
          @click="toggleDetail(item)"
        >
          <CardContent class="p-4">
            <!-- Card header -->
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-medium leading-snug">{{ item.title }}</p>
              <component
                :is="expandedId === item.id ? ChevronUp : ChevronDown"
                class="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
            </div>

            <!-- Badges -->
            <div class="mt-2 flex flex-wrap gap-1.5">
              <span
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                :class="STATUS_CONFIG[item.status].class"
              >
                <component :is="STATUS_CONFIG[item.status].icon" class="size-3" />
                {{ STATUS_CONFIG[item.status].label }}
              </span>
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                :class="PRIORITY_CONFIG[item.priority].class"
              >
                {{ PRIORITY_CONFIG[item.priority].label }}
              </span>
            </div>

            <p class="mt-2 text-xs text-muted-foreground">{{ formatDate(item.createdAt) }}</p>

            <!-- Expanded detail -->
            <div v-if="expandedId === item.id" class="mt-4 border-t pt-4" @click.stop>
              <div v-if="detail.isLoading.value" class="space-y-2">
                <Skeleton class="h-4 w-full" />
                <Skeleton class="h-4 w-2/3" />
              </div>

              <template v-else-if="detail.incident.value">
                <!-- Description -->
                <p class="text-sm text-muted-foreground">{{ detail.incident.value.description }}</p>

                <!-- Photos -->
                <div
                  v-if="detail.incident.value.photos && detail.incident.value.photos.length > 0"
                  class="mt-3"
                >
                  <p class="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Camera class="size-3" />
                    Fotos adjuntas
                  </p>
                  <div class="flex gap-2 overflow-x-auto">
                    <img
                      v-for="photo in detail.incident.value.photos"
                      :key="photo.id"
                      :src="`/api/incidents/photos/${photo.filePath}`"
                      :alt="`Foto de incidencia`"
                      class="size-20 shrink-0 rounded-lg border object-cover"
                    />
                  </div>
                </div>

                <!-- Status history -->
                <div
                  v-if="detail.incident.value.updates && detail.incident.value.updates.length > 0"
                  class="mt-4"
                >
                  <p class="mb-2 text-xs font-medium text-muted-foreground">Historial</p>
                  <div class="space-y-2">
                    <div
                      v-for="update in detail.incident.value.updates"
                      :key="update.id"
                      class="flex items-start gap-2 rounded-md bg-muted/50 p-2"
                    >
                      <div class="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      <div class="min-w-0">
                        <p class="text-xs">
                          <span class="font-medium">{{ STATUS_CONFIG[update.oldStatus].label }}</span>
                          <span class="text-muted-foreground"> → </span>
                          <span class="font-medium">{{ STATUS_CONFIG[update.newStatus].label }}</span>
                        </p>
                        <p v-if="update.note" class="mt-0.5 text-xs text-muted-foreground">{{ update.note }}</p>
                        <p class="mt-0.5 text-xs text-muted-foreground">{{ formatDateTime(update.createdAt) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </CardContent>
        </Card>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            <ChevronLeft class="mr-1 size-4" />
            Anterior
          </Button>
          <span class="text-sm text-muted-foreground">
            Página {{ currentPage }} de {{ totalPages }}
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
    </template>
  </div>
</template>
