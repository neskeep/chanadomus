<script setup lang="ts">
import {
  Calendar,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Video,
  MapPin,
  Clock,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type {
  Meeting,
  MeetingType,
  MeetingStatus,
  CreateMeeting,
  UpdateMeeting,
} from '~~/shared/types/meeting'
import { MEETING_TYPES, MEETING_STATUSES } from '~~/shared/types/meeting'

useHead({ title: 'Gestion de Reuniones' })

const { formatDateTime } = useFormatDate()

const {
  meetings,
  meta,
  isLoading,
  isSubmitting,
  error,
  fetchMeetings,
  createMeeting,
  updateMeeting,
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

// Create/Edit dialog
const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const formTitle = ref('')
const formDescription = ref('')
const formDate = ref('')
const formEndDate = ref('')
const formLocation = ref('')
const formMeetingLink = ref('')
const formType = ref<MeetingType>('ordinaria')
const formAgenda = ref('')
const formMinutes = ref('')
const formStatus = ref<MeetingStatus>('programada')

// Delete dialog
const deleteId = ref<string | null>(null)
const deleteDialogOpen = ref(false)

import { MEETING_TYPE_COLORS as TYPE_COLORS, MEETING_STATUS_COLORS as STATUS_COLORS } from '~/composables/useColorMap'

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

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

async function loadMeetings() {
  const params: { type?: MeetingType; status?: MeetingStatus } = {}
  if (filterType.value) params.type = filterType.value
  if (filterStatus.value) params.status = filterStatus.value
  await fetchMeetings(params)
}

watch([filterType, filterStatus], () => {
  loadMeetings()
})

onMounted(() => {
  loadMeetings()
})

function resetForm() {
  formTitle.value = ''
  formDescription.value = ''
  formDate.value = ''
  formEndDate.value = ''
  formLocation.value = ''
  formMeetingLink.value = ''
  formType.value = 'ordinaria'
  formAgenda.value = ''
  formMinutes.value = ''
  formStatus.value = 'programada'
}

function openCreateDialog() {
  editingId.value = null
  resetForm()
  dialogOpen.value = true
}

function openEditDialog(meeting: Meeting) {
  editingId.value = meeting.id
  formTitle.value = meeting.title
  formDescription.value = meeting.description ?? ''
  formDate.value = toLocalInput(meeting.date)
  formEndDate.value = meeting.endDate ? toLocalInput(meeting.endDate) : ''
  formLocation.value = meeting.location ?? ''
  formMeetingLink.value = meeting.meetingLink ?? ''
  formType.value = meeting.type
  formAgenda.value = meeting.agenda ?? ''
  formMinutes.value = meeting.minutes ?? ''
  formStatus.value = meeting.status
  dialogOpen.value = true
}

const canSubmit = computed(() =>
  formTitle.value.trim().length > 0 && formDate.value.length > 0 && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    const dateISO = new Date(formDate.value).toISOString()
    const endDateISO = formEndDate.value ? new Date(formEndDate.value).toISOString() : undefined

    if (editingId.value) {
      const data: UpdateMeeting = {
        title: formTitle.value.trim(),
        description: formDescription.value.trim() || undefined,
        date: dateISO,
        endDate: endDateISO,
        location: formLocation.value.trim() || undefined,
        meetingLink: formMeetingLink.value.trim() || undefined,
        type: formType.value,
        status: formStatus.value,
        agenda: formAgenda.value.trim() || undefined,
        minutes: formMinutes.value.trim() || undefined,
      }
      await updateMeeting(editingId.value, data)
      toast.success('Reunion actualizada')
    }
    else {
      const data: CreateMeeting = {
        title: formTitle.value.trim(),
        description: formDescription.value.trim() || undefined,
        date: dateISO,
        endDate: endDateISO,
        location: formLocation.value.trim() || undefined,
        meetingLink: formMeetingLink.value.trim() || undefined,
        type: formType.value,
        agenda: formAgenda.value.trim() || undefined,
      }
      await createMeeting(data)
      toast.success('Reunion creada')
    }
    dialogOpen.value = false
    await loadMeetings()
  }
  catch {
    toast.error(error.value ?? 'Error al guardar reunion')
  }
}

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
    <Teleport :to="target" defer v-if="isMounted">
      <TopbarFilters :active="filterType !== '' || filterStatus !== ''" @clear="filterType = ''; filterStatus = ''">
        <TopbarFilterGroup v-model="filterType" label="Tipo" :options="typeOptions" />
        <TopbarFilterGroup v-model="filterStatus" label="Estado" :options="meetingStatusOptions" />
      </TopbarFilters>
      <Button size="sm" @click="openCreateDialog">
        <Plus class="mr-1.5 size-3.5" />
        Nuevo
      </Button>
    </Teleport>

    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-2">
      <div class="flex items-center gap-3 rounded-lg border bg-card p-4">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-blue-100">
          <Calendar class="size-5 text-blue-600" />
        </div>
        <div>
          <p v-if="isLoading"><Skeleton class="h-5 w-8" /></p>
          <p v-else class="text-lg font-bold leading-none">{{ totalProgramadas }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">Programadas</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-lg border bg-card p-4">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-100">
          <CalendarDays class="size-5 text-emerald-600" />
        </div>
        <div>
          <p v-if="isLoading"><Skeleton class="h-5 w-8" /></p>
          <p v-else class="text-lg font-bold leading-none">{{ totalEsteMes }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">Este Mes</p>
        </div>
      </div>
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
        <Button @click="openCreateDialog">
          <Plus class="mr-1.5 size-4" />
          Nueva Reunion
        </Button>
      </template>
    </EmptyState>

    <!-- Table (desktop) / Cards (mobile) -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titulo</TableHead>
              <TableHead>Fecha / Hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Link</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
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
                    @click="openEditDialog(item)"
                  >
                    <Pencil class="size-4" />
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

      <!-- Mobile cards -->
      <div class="space-y-3 md:hidden">
        <Card v-for="item in meetings" :key="item.id">
          <CardContent class="p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium leading-snug">{{ item.title }}</p>
                <div class="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock class="size-3 shrink-0" />
                  <span>{{ formatDateTime(item.date) }}</span>
                </div>
                <div v-if="item.location" class="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin class="size-3 shrink-0" />
                  <span>{{ item.location }}</span>
                </div>
              </div>
              <a
                v-if="item.meetingLink"
                :href="item.meetingLink"
                target="_blank"
                rel="noopener"
                class="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 hover:bg-muted"
                title="Abrir enlace de reunion"
              >
                <Video class="size-4 text-primary" />
              </a>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                :class="TYPE_COLORS[item.type]"
              >
                {{ TYPE_LABELS[item.type] }}
              </span>
              <span
                class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                :class="STATUS_COLORS[item.status]"
              >
                {{ STATUS_LABELS[item.status] }}
              </span>
            </div>
            <div class="mt-3 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                class="size-8"
                title="Editar"
                @click="openEditDialog(item)"
              >
                <Pencil class="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 text-destructive hover:text-destructive"
                title="Eliminar"
                @click="confirmDelete(item.id)"
              >
                <Trash2 class="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Create/Edit Sheet -->
    <Sheet v-model:open="dialogOpen">
      <SheetContent side="right" class="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{{ editingId ? 'Editar Reunion' : 'Nueva Reunion' }}</SheetTitle>
          <SheetDescription>
            {{ editingId ? 'Modifica los datos de la reunion' : 'Completa los datos para programar una reunion' }}
          </SheetDescription>
        </SheetHeader>

        <form class="space-y-4 py-2" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="meet-title">Titulo</Label>
            <Input id="meet-title" v-model="formTitle" placeholder="Titulo de la reunion" class="h-12" required />
          </div>

          <div class="space-y-2">
            <Label for="meet-description">Descripcion</Label>
            <Textarea id="meet-description" v-model="formDescription" placeholder="Descripcion opcional..." rows="2" />
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="meet-date">Fecha y Hora</Label>
              <Input id="meet-date" v-model="formDate" type="datetime-local" class="h-12" required />
            </div>
            <div class="space-y-2">
              <Label for="meet-end-date">Hora de Fin</Label>
              <Input id="meet-end-date" v-model="formEndDate" type="datetime-local" class="h-12" />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="meet-location">Ubicacion</Label>
            <Input id="meet-location" v-model="formLocation" placeholder="Salon de usos multiples" class="h-12" />
          </div>

          <div class="space-y-2">
            <Label for="meet-link">Link de Reunion</Label>
            <Input id="meet-link" v-model="formMeetingLink" placeholder="https://meet.google.com/..." class="h-12" />
          </div>

          <div class="space-y-2">
            <Label for="meet-type">Tipo</Label>
            <Select v-model="formType">
              <SelectTrigger id="meet-type" class="h-12">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="t in MEETING_TYPES" :key="t.key" :value="t.key">
                  {{ t.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="meet-agenda">Agenda</Label>
            <Textarea id="meet-agenda" v-model="formAgenda" placeholder="Puntos a tratar..." rows="3" />
          </div>

          <!-- Only when editing -->
          <template v-if="editingId">
            <div class="space-y-2">
              <Label for="meet-minutes">Acta / Minuta</Label>
              <Textarea id="meet-minutes" v-model="formMinutes" placeholder="Registro de la reunion..." rows="3" />
            </div>

            <div class="space-y-2">
              <Label for="meet-status">Estado</Label>
              <Select v-model="formStatus">
                <SelectTrigger id="meet-status" class="h-12">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="s in MEETING_STATUSES" :key="s.key" :value="s.key">
                    {{ s.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </template>

          <div class="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" @click="dialogOpen = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="!canSubmit">
              <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
              {{ isSubmitting ? 'Guardando...' : (editingId ? 'Guardar cambios' : 'Crear reunion') }}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

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
