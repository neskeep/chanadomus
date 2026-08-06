<script setup lang="ts">
import { Loader2, Clock } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { CreateEvent } from '~~/shared/types/event'

useHead({ title: 'Crear Evento' })

const router = useRouter()
const { isSubmitting, error, createEvent } = useEvents()

// --- Form state ---
const formTitle = ref('')
const formDescription = ref('')
const formStartsAt = ref('')
const formEndsAt = ref('')
const formGuestLimit = ref<number | undefined>(undefined)
const formNotes = ref('')

const canSubmit = computed(() =>
  formTitle.value.trim().length > 0
  && formStartsAt.value
  && formEndsAt.value
  && new Date(formEndsAt.value) > new Date(formStartsAt.value)
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    const data: CreateEvent = {
      title: formTitle.value.trim(),
      description: formDescription.value.trim() || undefined,
      unitId: undefined, // Server uses session.user.unitId for conserje
      startsAt: new Date(formStartsAt.value).toISOString(),
      endsAt: new Date(formEndsAt.value).toISOString(),
      guestLimit: formGuestLimit.value || undefined,
      notes: formNotes.value.trim() || undefined,
    }
    const created = await createEvent(data)
    toast.success('Evento creado correctamente')
    router.push(`/conserje/eventos/${created.id}`)
  }
  catch {
    toast.error(error.value ?? 'Error al crear evento')
  }
}
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Error -->
          <ErrorAlert v-if="error" :message="error" />

          <!-- Título -->
          <div class="space-y-1.5">
            <Label for="event-title">Título <span class="text-destructive">*</span></Label>
            <Input
              id="event-title"
              v-model="formTitle"
              placeholder="Nombre del evento"
              class="h-12 text-base"
              required
            />
          </div>

          <!-- Descripción -->
          <div class="space-y-1.5">
            <Label for="event-description">Descripción</Label>
            <Textarea
              id="event-description"
              v-model="formDescription"
              placeholder="Descripción opcional..."
              rows="2"
              class="text-base"
            />
          </div>

          <!-- Fecha y Hora Inicio / Fin -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="event-starts">Inicio <span class="text-destructive">*</span></Label>
              <div class="relative">
                <Clock class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="event-starts"
                  v-model="formStartsAt"
                  type="datetime-local"
                  class="h-12 pl-9 text-base"
                  required
                />
              </div>
            </div>
            <div class="space-y-1.5">
              <Label for="event-ends">Fin <span class="text-destructive">*</span></Label>
              <div class="relative">
                <Clock class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="event-ends"
                  v-model="formEndsAt"
                  type="datetime-local"
                  class="h-12 pl-9 text-base"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Límite de invitados -->
          <div class="space-y-1.5">
            <Label for="event-guest-limit">Límite de invitados</Label>
            <Input
              id="event-guest-limit"
              v-model.number="formGuestLimit"
              type="number"
              min="1"
              placeholder="Sin límite"
              class="h-12 text-base"
            />
          </div>

          <!-- Notas -->
          <div class="space-y-1.5">
            <Label for="event-notes">Notas</Label>
            <Textarea
              id="event-notes"
              v-model="formNotes"
              placeholder="Notas internas para vigilancia"
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
            {{ isSubmitting ? 'Creando...' : 'Crear Evento' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
