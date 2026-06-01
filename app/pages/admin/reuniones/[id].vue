<script setup lang="ts">
import { Loader2, CalendarIcon, Clock, Plus, X, Users, CheckSquare, ListChecks, MessageSquare, Search } from 'lucide-vue-next'
import { CalendarDate } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import { toast } from 'vue-sonner'
import type { MeetingType, MeetingStatus, UpdateMeeting, AgendaItem, MeetingAttendee } from '~~/shared/types/meeting'
import { MEETING_TYPES, MEETING_STATUSES } from '~~/shared/types/meeting'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const {
  isLoading,
  isSubmitting,
  error,
  fetchMeeting,
  updateMeeting,
} = useMeetings()

useHead({ title: 'Editar Reunión' })

// --- Form state ---
const formTitle = ref('')
const formDescription = ref('')
const formDateValue = shallowRef<DateValue | undefined>(undefined)
const formTime = ref('09:00')
const datePickerOpen = ref(false)
const formEndDateValue = shallowRef<DateValue | undefined>(undefined)
const formEndTime = ref('10:00')
const endDatePickerOpen = ref(false)
const formLocation = ref('')
const formMeetingLink = ref('')
const formType = ref<MeetingType>('ordinaria')
const formStatus = ref<MeetingStatus>('programada')
const loaded = ref(false)

// Agenda (structured)
const formAgendaItems = ref<AgendaItem[]>([])
const newAgendaItem = ref('')

// Minutes (structured)
const formMinutesAttendeesData = ref<MeetingAttendee[]>([])
const formMinutesQuorum = ref(false)
const formMinutesAgreementsList = ref<string[]>([])
const newAgreement = ref('')
const formMinutesNotes = ref('')

// --- Tenant users for attendee selector ---
interface TenantUser {
  id: string
  name: string
  role: string
  unitLabel: string | null
}

const tenantUsers = ref<TenantUser[]>([])
const attendeeSearch = ref('')

async function loadUsers() {
  try {
    const res = await $fetch<{ data: TenantUser[] }>('/api/admin/users')
    tenantUsers.value = res.data
  }
  catch {
    // silently fail
  }
}

const filteredUsers = computed(() => {
  const selected = new Set(formMinutesAttendeesData.value.map(a => a.id))
  const q = attendeeSearch.value.toLowerCase().trim()
  return tenantUsers.value
    .filter(u => !selected.has(u.id))
    .filter(u => !q || u.name.toLowerCase().includes(q) || (u.unitLabel?.toLowerCase().includes(q) ?? false))
    .slice(0, 20)
})

function addAttendee(user: TenantUser) {
  formMinutesAttendeesData.value.push({ id: user.id, name: user.name })
  attendeeSearch.value = ''
}

function removeAttendee(index: number) {
  formMinutesAttendeesData.value.splice(index, 1)
}

// --- Agenda item helpers ---
function addAgendaItem() {
  const text = newAgendaItem.value.trim()
  if (!text) return
  formAgendaItems.value.push({ text })
  newAgendaItem.value = ''
}

function removeAgendaItem(index: number) {
  formAgendaItems.value.splice(index, 1)
}

// --- Agreement helpers ---
function addAgreement() {
  const text = newAgreement.value.trim()
  if (!text) return
  formMinutesAgreementsList.value.push(text)
  newAgreement.value = ''
}

function removeAgreement(index: number) {
  formMinutesAgreementsList.value.splice(index, 1)
}

// --- Date helpers ---
function formatPickerDate(d: DateValue): string {
  const date = new Date(d.year, d.month - 1, d.day)
  return date.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })
}

function parseISODate(iso: string): CalendarDate {
  const d = new Date(iso)
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function parseISOTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function combineDateTimeISO(d: DateValue, time: string): string {
  const iso = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}T${time}:00`
  return new Date(iso).toISOString()
}

const canSubmit = computed(() =>
  formTitle.value.trim().length > 0
  && formDateValue.value
  && formTime.value
  && !isSubmitting.value,
)

async function loadMeeting() {
  try {
    const meeting = await fetchMeeting(id)
    formTitle.value = meeting.title
    formDescription.value = meeting.description ?? ''
    formDateValue.value = parseISODate(meeting.date)
    formTime.value = parseISOTime(meeting.date)
    if (meeting.endDate) {
      formEndDateValue.value = parseISODate(meeting.endDate)
      formEndTime.value = parseISOTime(meeting.endDate)
    }
    formLocation.value = meeting.location ?? ''
    formMeetingLink.value = meeting.meetingLink ?? ''
    formType.value = meeting.type
    formAgendaItems.value = meeting.agendaItems ?? []
    formMinutesAttendeesData.value = meeting.minutesAttendeesData ?? []
    formMinutesQuorum.value = meeting.minutesQuorum ?? false
    formMinutesAgreementsList.value = meeting.minutesAgreementsList ?? []
    formMinutesNotes.value = meeting.minutesNotes ?? ''
    formStatus.value = meeting.status
    loaded.value = true
  }
  catch {
    // error is set by composable
  }
}

async function handleSubmit() {
  if (!canSubmit.value || !formDateValue.value) return
  try {
    const dateISO = combineDateTimeISO(formDateValue.value, formTime.value)
    const endDateISO = formEndDateValue.value
      ? combineDateTimeISO(formEndDateValue.value, formEndTime.value)
      : undefined

    const data: UpdateMeeting = {
      title: formTitle.value.trim(),
      description: formDescription.value.trim() || undefined,
      date: dateISO,
      endDate: endDateISO,
      location: formLocation.value.trim() || undefined,
      meetingLink: formMeetingLink.value.trim() || undefined,
      type: formType.value,
      status: formStatus.value,
      agendaItems: formAgendaItems.value.length > 0 ? formAgendaItems.value : undefined,
      minutesAttendeesData: formMinutesAttendeesData.value.length > 0 ? formMinutesAttendeesData.value : undefined,
      minutesQuorum: formMinutesQuorum.value || undefined,
      minutesAgreementsList: formMinutesAgreementsList.value.length > 0 ? formMinutesAgreementsList.value : undefined,
      minutesNotes: formMinutesNotes.value.trim() || undefined,
    }
    await updateMeeting(id, data)
    toast.success('Reunión actualizada correctamente')
    router.push('/admin/reuniones')
  }
  catch {
    toast.error(error.value ?? 'Error al guardar reunión')
  }
}

onMounted(() => {
  loadMeeting()
  loadUsers()
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading && !loaded" class="space-y-4">
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-24 w-full" />
    </div>

    <!-- Error -->
    <ErrorAlert v-else-if="error && !loaded" :message="error" />

    <!-- Form -->
    <Card v-else>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Error -->
          <ErrorAlert v-if="error" :message="error" />

          <!-- Título -->
          <div class="space-y-1.5">
            <Label for="meet-title">Título <span class="text-destructive">*</span></Label>
            <Input
              id="meet-title"
              v-model="formTitle"
              placeholder="Título de la reunión"
              class="h-12 text-base"
              required
            />
          </div>

          <!-- Descripción -->
          <div class="space-y-1.5">
            <Label for="meet-description">Descripción</Label>
            <Textarea
              id="meet-description"
              v-model="formDescription"
              placeholder="Descripción opcional..."
              rows="2"
              class="text-base"
            />
          </div>

          <!-- Fecha y Hora -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label>Fecha <span class="text-destructive">*</span></Label>
              <Popover v-model:open="datePickerOpen">
                <PopoverTrigger as-child>
                  <Button variant="outline" class="h-12 w-full justify-start rounded-lg text-base font-normal">
                    <CalendarIcon class="mr-2 size-4 shrink-0 text-muted-foreground" />
                    <span class="truncate">{{ formDateValue ? formatPickerDate(formDateValue) : 'Seleccionar fecha' }}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar
                    :model-value="formDateValue"
                    locale="es"
                    @update:model-value="(v: DateValue | undefined) => { if (v) { formDateValue = v; datePickerOpen = false } }"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div class="space-y-1.5">
              <Label for="meet-time">Hora de inicio <span class="text-destructive">*</span></Label>
              <div class="relative">
                <Clock class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="meet-time"
                  v-model="formTime"
                  type="time"
                  class="h-12 pl-9 text-base"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Fecha y Hora de Fin -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label>Fecha de fin</Label>
              <Popover v-model:open="endDatePickerOpen">
                <PopoverTrigger as-child>
                  <Button variant="outline" class="h-12 w-full justify-start rounded-lg text-base font-normal">
                    <CalendarIcon class="mr-2 size-4 shrink-0 text-muted-foreground" />
                    <span class="truncate">{{ formEndDateValue ? formatPickerDate(formEndDateValue) : 'Misma fecha' }}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar
                    :model-value="formEndDateValue"
                    locale="es"
                    @update:model-value="(v: DateValue | undefined) => { if (v) { formEndDateValue = v; endDatePickerOpen = false } }"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div class="space-y-1.5">
              <Label for="meet-end-time">Hora de fin</Label>
              <div class="relative">
                <Clock class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="meet-end-time"
                  v-model="formEndTime"
                  type="time"
                  class="h-12 pl-9 text-base"
                />
              </div>
            </div>
          </div>

          <!-- Ubicación + Link row -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="meet-location">Ubicación</Label>
              <Input
                id="meet-location"
                v-model="formLocation"
                placeholder="Salón de usos múltiples"
                class="h-12 text-base"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="meet-link">Link de reunión</Label>
              <Input
                id="meet-link"
                v-model="formMeetingLink"
                placeholder="https://meet.google.com/..."
                class="h-12 text-base"
              />
            </div>
          </div>

          <!-- Tipo + Estado row -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="meet-type">Tipo</Label>
              <Select v-model="formType">
                <SelectTrigger id="meet-type" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="t in MEETING_TYPES" :key="t.key" :value="t.key">
                    {{ t.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label for="meet-status">Estado</Label>
              <Select v-model="formStatus">
                <SelectTrigger id="meet-status" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="s in MEETING_STATUSES" :key="s.key" :value="s.key">
                    {{ s.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Agenda (puntos) -->
          <div class="space-y-3">
            <Label>Puntos de agenda</Label>
            <div v-if="formAgendaItems.length > 0" class="space-y-2">
              <div
                v-for="(item, idx) in formAgendaItems"
                :key="idx"
                class="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
              >
                <span class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                  {{ idx + 1 }}
                </span>
                <span class="flex-1 text-sm">{{ item.text }}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="size-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                  @click="removeAgendaItem(idx)"
                >
                  <X class="size-4" />
                </Button>
              </div>
            </div>
            <div class="flex gap-2">
              <Input
                v-model="newAgendaItem"
                placeholder="Escribir punto de agenda..."
                class="h-10 flex-1 text-base"
                @keydown.enter.prevent="addAgendaItem"
              />
              <Button
                type="button"
                variant="outline"
                class="h-10 shrink-0 gap-1.5"
                :disabled="!newAgendaItem.trim()"
                @click="addAgendaItem"
              >
                <Plus class="size-4" />
                Agregar
              </Button>
            </div>
          </div>

          <!-- Sección: Acta / Minuta -->
          <Separator />
          <div class="space-y-1">
            <h3 class="text-base font-semibold">Acta / Minuta</h3>
            <p class="text-sm text-muted-foreground">Registro estructurado de la reunión</p>
          </div>

          <!-- Asistentes (selector de usuarios) -->
          <div class="space-y-2">
            <Label class="flex items-center gap-1.5">
              <Users class="size-4 text-muted-foreground" />
              Asistentes
            </Label>

            <!-- Selected attendees as badges -->
            <div v-if="formMinutesAttendeesData.length > 0" class="flex flex-wrap gap-1.5">
              <Badge
                v-for="(attendee, idx) in formMinutesAttendeesData"
                :key="attendee.id"
                variant="secondary"
                class="gap-1 pr-1 text-sm"
              >
                {{ attendee.name }}
                <button
                  type="button"
                  class="ml-0.5 rounded-lg p-0.5 hover:bg-foreground/10"
                  @click="removeAttendee(idx)"
                >
                  <X class="size-3" />
                </button>
              </Badge>
            </div>

            <!-- Search users input -->
            <Popover>
              <PopoverTrigger as-child>
                <Button variant="outline" class="h-10 w-full justify-start gap-2 text-base font-normal text-muted-foreground">
                  <Search class="size-4 shrink-0" />
                  Buscar propietario...
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-[var(--reka-popover-trigger-width)] p-0" align="start">
                <div class="p-2">
                  <Input
                    v-model="attendeeSearch"
                    placeholder="Nombre o unidad..."
                    class="h-9 text-sm"
                    autofocus
                  />
                </div>
                <div class="max-h-48 overflow-y-auto">
                  <button
                    v-for="u in filteredUsers"
                    :key="u.id"
                    type="button"
                    class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    @click="addAttendee(u)"
                  >
                    <span class="flex-1 truncate">{{ u.name }}</span>
                    <span v-if="u.unitLabel" class="shrink-0 text-xs text-muted-foreground">{{ u.unitLabel }}</span>
                  </button>
                  <p v-if="filteredUsers.length === 0" class="px-3 py-2 text-xs text-muted-foreground">
                    No se encontraron usuarios
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <!-- Quórum -->
          <div class="flex items-center gap-3">
            <Switch
              id="meet-quorum"
              :checked="formMinutesQuorum"
              @update:checked="formMinutesQuorum = $event"
            />
            <Label for="meet-quorum" class="cursor-pointer text-base">Se alcanzó quórum</Label>
          </div>

          <!-- Puntos tratados (basados en agenda) -->
          <div v-if="formAgendaItems.length > 0" class="space-y-3">
            <Label class="flex items-center gap-1.5">
              <ListChecks class="size-4 text-muted-foreground" />
              Puntos tratados
            </Label>
            <p class="text-xs text-muted-foreground">Anote lo discutido en cada punto de la agenda</p>
            <div class="space-y-3">
              <div
                v-for="(item, idx) in formAgendaItems"
                :key="idx"
                class="space-y-1.5 rounded-lg border p-3"
              >
                <div class="flex items-center gap-2">
                  <span class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {{ idx + 1 }}
                  </span>
                  <span class="text-sm font-medium">{{ item.text }}</span>
                </div>
                <Textarea
                  v-model="item.discussed"
                  placeholder="¿Qué se discutió sobre este punto?"
                  rows="2"
                  class="text-sm"
                />
              </div>
            </div>
          </div>

          <!-- Acuerdos (lista) -->
          <div class="space-y-3">
            <Label class="flex items-center gap-1.5">
              <CheckSquare class="size-4 text-muted-foreground" />
              Acuerdos
            </Label>
            <div v-if="formMinutesAgreementsList.length > 0" class="space-y-2">
              <div
                v-for="(agreement, idx) in formMinutesAgreementsList"
                :key="idx"
                class="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
              >
                <span class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                  {{ idx + 1 }}
                </span>
                <span class="flex-1 text-sm">{{ agreement }}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="size-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                  @click="removeAgreement(idx)"
                >
                  <X class="size-4" />
                </Button>
              </div>
            </div>
            <div class="flex gap-2">
              <Input
                v-model="newAgreement"
                placeholder="Escribir acuerdo..."
                class="h-10 flex-1 text-base"
                @keydown.enter.prevent="addAgreement"
              />
              <Button
                type="button"
                variant="outline"
                class="h-10 shrink-0 gap-1.5"
                :disabled="!newAgreement.trim()"
                @click="addAgreement"
              >
                <Plus class="size-4" />
                Agregar
              </Button>
            </div>
          </div>

          <!-- Observaciones -->
          <div class="space-y-1.5">
            <Label for="meet-notes" class="flex items-center gap-1.5">
              <MessageSquare class="size-4 text-muted-foreground" />
              Observaciones
            </Label>
            <Textarea
              id="meet-notes"
              v-model="formMinutesNotes"
              placeholder="Notas adicionales..."
              rows="2"
              class="text-base"
            />
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Guardando...' : 'Guardar cambios' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
