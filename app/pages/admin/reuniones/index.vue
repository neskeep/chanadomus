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
  Filter,
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
const filterType = ref<MeetingType | 'all'>('all')
const filterStatus = ref<MeetingStatus | 'all'>('all')
const showFilters = ref(false)

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

const TYPE_COLORS: Record<MeetingType, string> = {
  ordinaria: 'bg-blue-100 text-blue-700',
  extraordinaria: 'bg-amber-100 text-amber-700',
  comite: 'bg-purple-100 text-purple-700',
  informativa: 'bg-cyan-100 text-cyan-700',
}

const TYPE_LABELS: Record<MeetingType, string> = {
  ordinaria: 'Ordinaria',
  extraordinaria: 'Extraordinaria',
  comite: 'Comité',
  informativa: 'Informativa',
}

const STATUS_COLORS: Record<MeetingStatus, string> = {
  programada: 'bg-blue-100 text-blue-700',
  en_curso: 'bg-emerald-100 text-emerald-700',
  completada: 'bg-zinc-100 text-zinc-600',
  cancelada: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<MeetingStatus, string> = {
  programada: 'Programada',
  en_curso: 'En Curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
}

// Stats
const totalProgramadas = computed(() => meetings.value.filter(m => m.status === 'programada').length)
const totalEsteMes = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  return meetings.value.filter((m) => {
    const d = new Date(m.date)
    return d.getFullYear() === year && d.getMonth() === month
  }).length
})

// Date formatting
function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`
}

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

async function loadMeetings() {
  const params: { type?: MeetingType; status?: MeetingStatus } = {}
  if (filterType.value && filterType.value !== 'all') params.type = filterType.value
  if (filterStatus.value && filterStatus.value !== 'all') params.status = filterStatus.value
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
  <div class="mx-auto max-w-5xl">
    <!-- Header -->
    <div class="mb-6 flex justify-end">
      <Button size="sm" @click="openCreateDialog">
        <Plus class="mr-1.5 size-4" />
        Nueva Reunion
      </Button>
    </div>

    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-2">
      <div class="flex items-center gap-3 rounded-lg border bg-card p-3">
        <div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-100">
          <Calendar class="size-4 text-blue-600" />
        </div>
        <div>
          <p v-if="isLoading"><Skeleton class="h-5 w-8" /></p>
          <p v-else class="text-lg font-bold leading-none">{{ totalProgramadas }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">Programadas</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-lg border bg-card p-3">
        <div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-100">
          <CalendarDays class="size-4 text-emerald-600" />
        </div>
        <div>
          <p v-if="isLoading"><Skeleton class="h-5 w-8" /></p>
          <p v-else class="text-lg font-bold leading-none">{{ totalEsteMes }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">Este Mes</p>
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

    <!-- Filters -->
    <div class="mb-4 space-y-3">
      <div class="flex justify-end">
        <Button
          variant="outline"
          size="icon"
          :class="{ 'border-primary text-primary': showFilters }"
          @click="showFilters = !showFilters"
        >
          <Filter class="size-4" />
        </Button>
      </div>

      <!-- Filter selects -->
      <div v-if="showFilters" class="grid grid-cols-2 gap-3">
        <Select v-model="filterType">
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem v-for="t in MEETING_TYPES" :key="t.key" :value="t.key">
              {{ t.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="filterStatus">
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem v-for="s in MEETING_STATUSES" :key="s.key" :value="s.key">
              {{ s.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-2">
      <Skeleton v-for="i in 5" :key="i" class="h-16 w-full rounded-lg" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="meetings.length === 0"
      class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
    >
      <div class="flex size-12 items-center justify-center rounded-full bg-muted">
        <Calendar class="size-6 text-muted-foreground" />
      </div>
      <div>
        <p class="font-medium">No hay reuniones</p>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ filterType !== 'all' || filterStatus !== 'all' ? 'Prueba cambiando los filtros' : 'Crea la primera reunion del condominio' }}
        </p>
      </div>
      <Button size="sm" @click="openCreateDialog">
        <Plus class="mr-1.5 size-4" />
        Nueva Reunion
      </Button>
    </div>

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
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="TYPE_COLORS[item.type]"
                >
                  {{ TYPE_LABELS[item.type] }}
                </span>
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
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
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                :class="TYPE_COLORS[item.type]"
              >
                {{ TYPE_LABELS[item.type] }}
              </span>
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
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

    <!-- Create/Edit Dialog -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ editingId ? 'Editar Reunion' : 'Nueva Reunion' }}</DialogTitle>
          <DialogDescription>
            {{ editingId ? 'Modifica los datos de la reunion' : 'Completa los datos para programar una reunion' }}
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4 py-2" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="meet-title">Titulo</Label>
            <Input id="meet-title" v-model="formTitle" placeholder="Titulo de la reunion" required />
          </div>

          <div class="space-y-2">
            <Label for="meet-description">Descripcion</Label>
            <Textarea id="meet-description" v-model="formDescription" placeholder="Descripcion opcional..." rows="2" />
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="meet-date">Fecha y Hora</Label>
              <Input id="meet-date" v-model="formDate" type="datetime-local" required />
            </div>
            <div class="space-y-2">
              <Label for="meet-end-date">Hora de Fin</Label>
              <Input id="meet-end-date" v-model="formEndDate" type="datetime-local" />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="meet-location">Ubicacion</Label>
            <Input id="meet-location" v-model="formLocation" placeholder="Salon de usos multiples" />
          </div>

          <div class="space-y-2">
            <Label for="meet-link">Link de Reunion</Label>
            <Input id="meet-link" v-model="formMeetingLink" placeholder="https://meet.google.com/..." />
          </div>

          <div class="space-y-2">
            <Label for="meet-type">Tipo</Label>
            <Select v-model="formType">
              <SelectTrigger id="meet-type">
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
                <SelectTrigger id="meet-status">
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
      </DialogContent>
    </Dialog>

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
