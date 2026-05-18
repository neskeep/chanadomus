<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { MeetingType, MeetingStatus, UpdateMeeting } from '~~/shared/types/meeting'
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
const formDate = ref('')
const formEndDate = ref('')
const formLocation = ref('')
const formMeetingLink = ref('')
const formType = ref<MeetingType>('ordinaria')
const formAgenda = ref('')
const formMinutes = ref('')
const formStatus = ref<MeetingStatus>('programada')
const loaded = ref(false)

const canSubmit = computed(() =>
  formTitle.value.trim().length > 0
  && formDate.value.length > 0
  && !isSubmitting.value,
)

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

async function loadMeeting() {
  try {
    const meeting = await fetchMeeting(id)
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
    loaded.value = true
  }
  catch {
    // error is set by composable
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    const dateISO = new Date(formDate.value).toISOString()
    const endDateISO = formEndDate.value ? new Date(formEndDate.value).toISOString() : undefined

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

          <!-- Fecha y Hora + Hora de Fin -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="meet-date">Fecha y hora <span class="text-destructive">*</span></Label>
              <Input
                id="meet-date"
                v-model="formDate"
                type="datetime-local"
                class="h-12 text-base"
                required
              />
            </div>
            <div class="space-y-1.5">
              <Label for="meet-end-date">Hora de fin</Label>
              <Input
                id="meet-end-date"
                v-model="formEndDate"
                type="datetime-local"
                class="h-12 text-base"
              />
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

          <!-- Agenda -->
          <div class="space-y-1.5">
            <Label for="meet-agenda">Agenda</Label>
            <Textarea
              id="meet-agenda"
              v-model="formAgenda"
              placeholder="Puntos a tratar..."
              rows="3"
              class="text-base"
            />
          </div>

          <!-- Acta / Minuta -->
          <div class="space-y-1.5">
            <Label for="meet-minutes">Acta / Minuta</Label>
            <Textarea
              id="meet-minutes"
              v-model="formMinutes"
              placeholder="Registro de la reunión..."
              rows="3"
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
