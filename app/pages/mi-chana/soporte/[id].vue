<script setup lang="ts">
import type { Component } from 'vue'
import {
  Circle,
  Eye,
  Code2,
  CheckCircle2,
  XCircle,
  Camera,
} from 'lucide-vue-next'
import type { SupportTicketStatus, SupportTicketPriority } from '~~/shared/types/support'
import {
  SUPPORT_STATUS_COLORS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_PRIORITY_COLORS,
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_TYPE_COLORS,
  SUPPORT_TYPE_LABELS,
} from '~/composables/useColorMap'

const route = useRoute()
const id = route.params.id as string

const { ticket, isLoading, error, fetchTicket } = useSupportTicketDetail()
const { formatDate, formatDateTime } = useFormatDate()

const pageOverride = computed(() => {
  if (!ticket.value) return null
  return { title: ticket.value.title }
})
usePageInfoOverride(pageOverride)

useHead({ title: () => ticket.value?.title ?? 'Ticket' })

const STATUS_CONFIG: Record<SupportTicketStatus, { label: string; class: string; icon: Component }> = {
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

onMounted(() => {
  fetchTicket(id)
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
    <ErrorAlert v-else-if="error && !ticket" :message="error" />

    <!-- Content -->
    <template v-else-if="ticket">
      <Card>
        <CardContent class="p-5 md:p-8">
          <div class="space-y-4">
            <!-- Status + Priority + Type badges -->
            <div class="flex flex-wrap gap-2">
              <span
                class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium"
                :class="STATUS_CONFIG[ticket.status].class"
              >
                <component :is="STATUS_CONFIG[ticket.status].icon" class="size-3.5" />
                {{ STATUS_CONFIG[ticket.status].label }}
              </span>
              <span
                class="inline-flex rounded-lg px-2.5 py-1 text-xs font-medium"
                :class="PRIORITY_CONFIG[ticket.priority].class"
              >
                {{ PRIORITY_CONFIG[ticket.priority].label }}
              </span>
              <span
                class="inline-flex rounded-lg px-2.5 py-1 text-xs font-medium"
                :class="SUPPORT_TYPE_COLORS[ticket.type]"
              >
                {{ SUPPORT_TYPE_LABELS[ticket.type] }}
              </span>
            </div>

            <!-- Meta: date -->
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>Reportado {{ formatDate(ticket.createdAt) }}</span>
            </div>

            <!-- Description -->
            <p class="text-base leading-relaxed">{{ ticket.description }}</p>

            <!-- Screenshots -->
            <div v-if="ticket.screenshots && ticket.screenshots.length > 0">
              <p class="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Camera class="size-4" />
                Capturas adjuntas
              </p>
              <div class="flex gap-3 overflow-x-auto pb-1">
                <a
                  v-for="screenshot in ticket.screenshots"
                  :key="screenshot.id"
                  :href="`/api/support/screenshots/${screenshot.filePath}`"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    :src="`/api/support/screenshots/${screenshot.filePath}`"
                    alt="Captura de pantalla del ticket"
                    class="size-28 shrink-0 rounded-lg border object-cover transition-opacity hover:opacity-80"
                  >
                </a>
              </div>
            </div>

            <!-- Extra info -->
            <div v-if="ticket.pageUrl || ticket.resolvedInVersion" class="space-y-1 text-sm text-muted-foreground">
              <p v-if="ticket.pageUrl">
                Página:
                <a :href="ticket.pageUrl" target="_blank" rel="noopener noreferrer" class="underline hover:text-foreground">
                  {{ ticket.pageUrl }}
                </a>
              </p>
              <p v-if="ticket.resolvedInVersion">
                Resuelto en versión: <span class="font-medium text-foreground">v{{ ticket.resolvedInVersion }}</span>
              </p>
            </div>

            <!-- Dates -->
            <div class="text-sm text-muted-foreground">
              <p>Creado: {{ formatDate(ticket.createdAt) }}</p>
              <p v-if="ticket.resolvedAt">Resuelto: {{ formatDate(ticket.resolvedAt) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Status history -->
      <Card v-if="ticket.updates && ticket.updates.length > 0" class="mt-4">
        <CardContent class="p-5 md:p-8">
          <p class="mb-4 text-base font-semibold">Historial de cambios</p>
          <div class="space-y-3">
            <div
              v-for="update in ticket.updates"
              :key="update.id"
              class="rounded-lg bg-muted/50 p-3"
            >
              <div class="flex items-center gap-2">
                <div class="size-2 shrink-0 rounded-lg bg-primary" />
                <span class="text-sm font-medium">
                  {{ STATUS_CONFIG[update.oldStatus].label }} &rarr; {{ STATUS_CONFIG[update.newStatus].label }}
                </span>
              </div>
              <p v-if="update.note" class="ml-4 mt-1 text-sm text-muted-foreground">{{ update.note }}</p>
              <p class="ml-4 mt-1 text-xs text-muted-foreground">{{ formatDateTime(update.createdAt) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
