<script setup lang="ts">
import {
  Calendar,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Video,
  MapPin,
  Clock,
  GripVertical,
  Check,
} from 'lucide-vue-next'
import draggable from 'vuedraggable'
import { toast } from 'vue-sonner'
import type {
  Meeting,
  MeetingType,
  MeetingStatus,
} from '~~/shared/types/meeting'

import { MEETING_TYPE_COLORS as TYPE_COLORS, MEETING_STATUS_COLORS as STATUS_COLORS } from '~/composables/useColorMap'

useHead({ title: 'Gestion de Reuniones' })

const { formatDateTime } = useFormatDate()
const { isReordering, isSaving, saveOrder } = useReorder()

const {
  meetings,
  isLoading,
  error,
  fetchMeetings,
  deleteMeeting,
} = useMeetings()

// Filters
const filterType = ref<MeetingType | ''>('')
const filterStatus = ref<MeetingStatus | ''>('')

const { target, isMounted } = useTopbarPortal()

const typeOptions = [
  { value: 'ordinaria' as const, label: 'Ordinaria' },
  { value: 'extraordinaria' as const, label: 'Extraordinaria' },
  { value: 'comite' as const, label: 'Comite' },
  { value: 'informativa' as const, label: 'Informativa' },
]

const meetingStatusOptions = [
  { value: 'programada' as const, label: 'Programada' },
  { value: 'en_curso' as const, label: 'En Curso' },
  { value: 'completada' as const, label: 'Completada' },
  { value: 'cancelada' as const, label: 'Cancelada' },
]

// Delete dialog
const deleteId = ref<string | null>(null)
const deleteDialogOpen = ref(false)

const TYPE_LABELS: Record<MeetingType, string> = {
  ordinaria: 'Ordinaria',
  extraordinaria: 'Extraordinaria',
  comite: 'Comité',
  informativa: 'Informativa',
}

const STATUS_LABELS: Record<MeetingStatus, string> = {
  programada: 'Programada',
  en_curso: 'En Curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
}

// Stats
const totalProgramadas = computed(() => meetings.value.filter(m => m.status === 'programada').length)
const clientNow = ref<Date | null>(null)
onMounted(() => { clientNow.value = new Date() })

const totalEsteMes = computed(() => {
  if (!clientNow.value) return 0
  const year = clientNow.value.getFullYear()
  const month = clientNow.value.getMonth()
  return meetings.value.filter((m) => {
    const d = new Date(m.date)
    return d.getFullYear() === year && d.getMonth() === month
  }).length
})

async function loadMeetings() {
  const params: { type?: MeetingType; status?: MeetingStatus } = {}
  if (filterType.value) params.type = filterType.value
  if (filterStatus.value) params.status = filterStatus.value
  await fetchMeetings(params)
}

// Local writable copy for drag-and-drop
const localMeetings = ref<Meeting[]>([])
watch(meetings, val => { localMeetings.value = [...val] }, { immediate: true })

function toggleReorder() {
  if (isReordering.value) {
    handleSaveOrder()
  }
  else {
    filterType.value = ''
    filterStatus.value = ''
    isReordering.value = true
  }
}

async function handleSaveOrder() {
  const items = localMeetings.value.map((item, index) => ({
    id: item.id,
    displayOrder: index,
  }))
  await saveOrder('meetings', items)
  toast.success('Orden guardado')
  isReordering.value = false
}

watch([filterType, filterStatus], () => {
  loadMeetings()
})

onMounted(() => {
  loadMeetings()
})

function confirmDelete(id: string) {
  deleteId.value = id
  deleteDialogOpen.value = true
}

async function handleDelete() {
  if (!deleteId.value) return
  try {
    await deleteMeeting(deleteId.value)
    toast.success('Reunion eliminada')
    deleteDialogOpen.value = false
    deleteId.value = null
    await loadMeetings()
  }
  catch {
    toast.error(error.value ?? 'Error al eliminar reunion')
  }
}
</script>

<template>
  <div>
    <!-- Topbar actions -->
    <Teleport v-if="isMounted" :to="target" defer>
      <TopbarFilters :active="filterType !== '' || filterStatus !== ''" @clear="filterType = ''; filterStatus = ''">
        <TopbarFilterGroup v-model="filterType" label="Tipo" :options="typeOptions" />
        <TopbarFilterGroup v-model="filterStatus" label="Estado" :options="meetingStatusOptions" />
      </TopbarFilters>
      <Button size="icon" variant="ghost" class="size-8" :disabled="isSaving" :title="isReordering ? 'Guardar orden' : 'Reordenar'" @click="toggleReorder">
        <Check v-if="isReordering" class="size-4 text-primary" />
        <GripVertical v-else class="size-4" />
      </Button>
      <NuxtLink to="/admin/reuniones/crear">
        <Button size="sm">
          <Plus class="mr-1.5 size-3.5" />
          Nuevo
        </Button>
      </NuxtLink>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" :disabled="isSaving" :title="isReordering ? 'Guardar orden' : 'Reordenar'" @click="toggleReorder">
        <Check v-if="isReordering" class="size-4 text-primary" />
        <GripVertical v-else class="size-4" />
      </Button>
      <Button size="icon" variant="ghost" class="size-9" as-child>
        <NuxtLink to="/admin/reuniones/crear">
          <Plus class="size-4" />
        </NuxtLink>
      </Button>
    </TopbarMobileAction>

    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-3">
      <StatCard label="Programadas" :value="totalProgramadas" :icon="Calendar" icon-bg-class="bg-primary/10 text-primary" :is-loading="isLoading" />
      <StatCard label="Este mes" :value="totalEsteMes" :icon="CalendarDays" icon-bg-class="bg-muted text-muted-foreground" :is-loading="isLoading" />
    </div>

    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="5" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="meetings.length === 0"
      :icon="Calendar"
      title="No hay reuniones"
      :description="filterType || filterStatus ? 'Prueba cambiando los filtros' : 'Crea la primera reunion del condominio'"
    >
      <template #action>
        <NuxtLink to="/admin/reuniones/crear">
          <Button>
            <Plus class="mr-1.5 size-4" />
            Nueva Reunion
          </Button>
        </NuxtLink>
      </template>
    </EmptyState>

    <!-- Table (desktop) / Cards (mobile) -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead v-if="isReordering" class="w-8" />
              <TableHead>Titulo</TableHead>
              <TableHead>Fecha / Hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Link</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <draggable
            v-if="isReordering"
            v-model="localMeetings"
            tag="tbody"
            item-key="id"
            handle=".drag-handle"
            ghost-class="opacity-50"
            :animation="200"
          >
            <template #item="{ element: item }: { element: Meeting }">
              <TableRow>
                <TableCell class="w-8 px-2">
                  <GripVertical class="drag-handle size-4 cursor-grab text-muted-foreground active:cursor-grabbing" />
                </TableCell>
                <TableCell class="font-medium">
                  {{ item.title }}
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-1.5 text-sm">
                    <Clock class="size-3.5 shrink-0 text-muted-foreground" />
                    <span>{{ formatDateTime(item.date) }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                    :class="TYPE_COLORS[item.type]"
                  >
                    {{ TYPE_LABELS[item.type] }}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                    :class="STATUS_COLORS[item.status]"
                  >
                    {{ STATUS_LABELS[item.status] }}
                  </span>
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </template>
          </draggable>
          <TableBody v-else>
            <TableRow v-for="item in meetings" :key="item.id">
              <TableCell class="font-medium">
                {{ item.title }}
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1.5 text-sm">
                  <Clock class="size-3.5 shrink-0 text-muted-foreground" />
                  <span>{{ formatDateTime(item.date) }}</span>
                </div>
                <div v-if="item.location" class="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin class="size-3 shrink-0" />
                  <span>{{ item.location }}</span>
                </div>
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                  :class="TYPE_COLORS[item.type]"
                >
                  {{ TYPE_LABELS[item.type] }}
                </span>
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                  :class="STATUS_COLORS[item.status]"
                >
                  {{ STATUS_LABELS[item.status] }}
                </span>
              </TableCell>
              <TableCell>
                <a
                  v-if="item.meetingLink"
                  :href="item.meetingLink"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-muted"
                  title="Abrir enlace de reunion"
                >
                  <Video class="size-4 text-primary" />
                </a>
                <span v-else class="text-muted-foreground">—</span>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10"
                    title="Editar"
                    as-child
                  >
                    <NuxtLink :to="`/admin/reuniones/${item.id}`">
                      <Pencil class="size-4" />
                    </NuxtLink>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-10 text-destructive hover:text-destructive"
                    title="Eliminar"
                    @click="confirmDelete(item.id)"
                  >
                    <Trash2 class="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile cards (reorder mode) -->
      <draggable
        v-if="isReordering"
        v-model="localMeetings"
        item-key="id"
        handle=".drag-handle"
        ghost-class="opacity-50"
        :animation="200"
        class="space-y-2 md:hidden"
      >
        <template #item="{ element: item }: { element: Meeting }">
          <Card class="px-3 py-2.5">
            <div class="flex items-center gap-2">
              <GripVertical class="drag-handle size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">{{ item.title }}</p>
                <span class="text-[11px] tabular-nums text-muted-foreground">{{ formatDateTime(item.date) }}</span>
              </div>
              <span
                class="shrink-0 rounded-lg px-1.5 py-0.5 text-[11px] font-medium"
                :class="TYPE_COLORS[item.type]"
              >
                {{ TYPE_LABELS[item.type] }}
              </span>
            </div>
          </Card>
        </template>
      </draggable>

      <!-- Mobile cards (normal mode) -->
      <div v-else class="space-y-2 md:hidden">
        <Card v-for="item in meetings" :key="item.id" class="px-3 py-2.5">
          <!-- Row 1: Title + Type badge + Video link -->
          <div class="flex items-center gap-2">
            <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ item.title }}</p>
            <span
              class="shrink-0 rounded-lg px-1.5 py-0.5 text-[11px] font-medium"
              :class="TYPE_COLORS[item.type]"
            >
              {{ TYPE_LABELS[item.type] }}
            </span>
            <a
              v-if="item.meetingLink"
              :href="item.meetingLink"
              target="_blank"
              rel="noopener"
              class="shrink-0 rounded-lg p-1 hover:bg-muted"
              title="Abrir enlace de reunion"
            >
              <Video class="size-3.5 text-primary" />
            </a>
          </div>
          <!-- Row 2: Status + datetime + location | Actions -->
          <div class="mt-1 flex items-center gap-x-1 text-[11px] text-muted-foreground">
            <span
              class="shrink-0 rounded-lg px-1.5 py-0.5 font-medium"
              :class="STATUS_COLORS[item.status]"
            >
              {{ STATUS_LABELS[item.status] }}
            </span>
            <span class="opacity-30">&middot;</span>
            <span class="tabular-nums">{{ formatDateTime(item.date) }}</span>
            <template v-if="item.location">
              <span class="opacity-30">&middot;</span>
              <span class="truncate">{{ item.location }}</span>
            </template>
            <span class="flex-1" />
            <Button variant="ghost" class="h-6 px-2 text-[11px]" as-child>
              <NuxtLink :to="`/admin/reuniones/${item.id}`">
                <Pencil class="mr-1 size-3" />
                Editar
              </NuxtLink>
            </Button>
            <Button variant="ghost" class="h-6 px-2 text-[11px] text-destructive hover:text-destructive" @click="confirmDelete(item.id)">
              <Trash2 class="mr-1 size-3" />
              Borrar
            </Button>
          </div>
        </Card>
      </div>
    </div>

    <!-- Delete AlertDialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar reunion</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion no se puede deshacer. La reunion sera eliminada permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="handleDelete"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
