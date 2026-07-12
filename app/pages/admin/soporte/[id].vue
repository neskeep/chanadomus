<script setup lang="ts">
import type { Component } from 'vue'
import {
  Circle,
  Eye,
  Code2,
  CheckCircle2,
  XCircle,
  Camera,
  Trash2,
  Loader2,
  ExternalLink,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { SupportTicketStatus, SupportTicketPriority, SupportTicketType } from '~~/shared/types/support'
import {
  SUPPORT_STATUS_COLORS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_PRIORITY_COLORS,
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_TYPE_COLORS,
  SUPPORT_TYPE_LABELS,
} from '~/composables/useColorMap'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const { ticket, isLoading, isUpdating, isDeleting, error, fetchTicket, updateStatus, deleteTicket } = useSupportTicketDetail()
const { formatDate, formatDateTime } = useFormatDate()

// Override page info with dynamic title
const pageOverride = computed(() => {
  if (!ticket.value) return null
  return { title: ticket.value.title }
})
usePageInfoOverride(pageOverride)

useHead({ title: () => ticket.value?.title ?? 'Ticket' })

// Status update form
const newStatus = ref<SupportTicketStatus | ''>('')
const statusNote = ref('')
const resolvedInVersion = ref('')

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

const TYPE_CONFIG: Record<SupportTicketType, { label: string; class: string }> = {
  bug: { label: SUPPORT_TYPE_LABELS.bug, class: SUPPORT_TYPE_COLORS.bug },
  sugerencia: { label: SUPPORT_TYPE_LABELS.sugerencia, class: SUPPORT_TYPE_COLORS.sugerencia },
  pregunta: { label: SUPPORT_TYPE_LABELS.pregunta, class: SUPPORT_TYPE_COLORS.pregunta },
}

async function handleUpdateStatus() {
  if (!newStatus.value) return
  try {
    await updateStatus(
      id,
      newStatus.value as SupportTicketStatus,
      statusNote.value || undefined,
      newStatus.value === 'resuelto' ? resolvedInVersion.value || undefined : undefined,
    )
    toast.success('Estado actualizado correctamente')
    newStatus.value = ''
    statusNote.value = ''
    resolvedInVersion.value = ''
  }
  catch {
    toast.error(error.value ?? 'Error al actualizar estado')
  }
}

async function handleDelete() {
  try {
    await deleteTicket(id)
    toast.success('Ticket eliminado correctamente')
    router.push('/admin/soporte')
  }
  catch {
    toast.error(error.value ?? 'Error al eliminar ticket')
  }
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
      <!-- Header info -->
      <Card class="mb-4">
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
                :class="TYPE_CONFIG[ticket.type].class"
              >
                {{ TYPE_CONFIG[ticket.type].label }}
              </span>
            </div>

            <!-- Meta: reporter + role + date -->
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span v-if="ticket.reportedByName" class="inline-flex items-center gap-1.5">
                Reportado por {{ ticket.reportedByName }}
                <span v-if="ticket.reportedByRole" class="inline-flex rounded-lg bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                  {{ ticket.reportedByRole }}
                </span>
              </span>
              <span class="tabular-nums">{{ formatDate(ticket.createdAt) }}</span>
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
                    alt="Captura del ticket"
                    class="size-28 shrink-0 rounded-lg border object-cover transition-opacity hover:opacity-80"
                  >
                </a>
              </div>
            </div>

            <!-- Page URL -->
            <div v-if="ticket.pageUrl" class="text-sm">
              <span class="text-muted-foreground">Página: </span>
              <a
                :href="ticket.pageUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
              >
                {{ ticket.pageUrl }}
                <ExternalLink class="size-3" />
              </a>
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
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="en_revision">En revisión</SelectItem>
                  <SelectItem value="en_desarrollo">En desarrollo</SelectItem>
                  <SelectItem value="resuelto">Resuelto</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
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

            <div v-if="newStatus === 'resuelto'" class="space-y-1.5">
              <Label for="resolved-version">Resuelto en versión</Label>
              <Input
                id="resolved-version"
                v-model="resolvedInVersion"
                placeholder="Ej: 1.5.0 (opcional)"
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

      <!-- Delete -->
      <Card class="mb-4 border-destructive/30">
        <CardContent class="flex items-center justify-between gap-4 p-5 md:px-8">
          <div>
            <p class="text-sm font-semibold text-destructive">Eliminar ticket</p>
            <p class="text-xs text-muted-foreground">Esta acción no se puede deshacer.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="destructive" size="sm">
                <Trash2 class="mr-1.5 size-3.5" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>¿Eliminar este ticket?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará permanentemente el ticket "{{ ticket.title }}" junto con sus capturas y historial de cambios.
              </AlertDialogDescription>
              <div class="flex justify-end gap-2">
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  class="bg-destructive text-white hover:bg-destructive/90"
                  :disabled="isDeleting"
                  @click="handleDelete"
                >
                  <Loader2 v-if="isDeleting" class="mr-1.5 size-3.5 animate-spin" />
                  Eliminar
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <!-- Status history -->
      <Card v-if="ticket.updates && ticket.updates.length > 0">
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
