<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { MeetingType, CreateMeeting } from '~~/shared/types/meeting'
import { MEETING_TYPES } from '~~/shared/types/meeting'

useHead({ title: 'Nueva Reunión' })

const router = useRouter()
const { isSubmitting, error, createMeeting } = useMeetings()

// --- Form state ---
const formTitle = ref('')
const formDescription = ref('')
const formDate = ref('')
const formEndDate = ref('')
const formLocation = ref('')
const formMeetingLink = ref('')
const formType = ref<MeetingType>('ordinaria')
const formAgenda = ref('')

const canSubmit = computed(() =>
  formTitle.value.trim().length > 0
  && formDate.value.length > 0
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    const dateISO = new Date(formDate.value).toISOString()
    const endDateISO = formEndDate.value ? new Date(formEndDate.value).toISOString() : undefined

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
    toast.success('Reunión creada correctamente')
    router.push('/admin/reuniones')
  }
  catch {
    toast.error(error.value ?? 'Error al crear reunión')
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl">
    <Card>
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

          <!-- Tipo -->
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

          <!-- Submit -->
          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Creando...' : 'Crear Reunión' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
