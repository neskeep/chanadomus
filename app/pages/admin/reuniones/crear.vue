<script setup lang="ts">
import { Loader2, CalendarIcon, Clock, Plus, X } from 'lucide-vue-next'
import type { DateValue } from 'reka-ui'
import { toast } from 'vue-sonner'
import type { MeetingType, CreateMeeting, AgendaItem } from '~~/shared/types/meeting'
import { MEETING_TYPES } from '~~/shared/types/meeting'

useHead({ title: 'Nueva Reunión' })

const router = useRouter()
const { isSubmitting, error, createMeeting } = useMeetings()

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
const formAgendaItems = ref<AgendaItem[]>([])
const newAgendaItem = ref('')
const formDisplayOrder = ref(0)

function addAgendaItem() {
  const text = newAgendaItem.value.trim()
  if (!text) return
  formAgendaItems.value.push({ text })
  newAgendaItem.value = ''
}

function removeAgendaItem(index: number) {
  formAgendaItems.value.splice(index, 1)
}

function formatPickerDate(d: DateValue): string {
  const date = new Date(d.year, d.month - 1, d.day)
  return date.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })
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

async function handleSubmit() {
  if (!canSubmit.value || !formDateValue.value) return
  try {
    const dateISO = combineDateTimeISO(formDateValue.value, formTime.value)
    const endDateISO = formEndDateValue.value
      ? combineDateTimeISO(formEndDateValue.value, formEndTime.value)
      : undefined

    const data: CreateMeeting = {
      title: formTitle.value.trim(),
      description: formDescription.value.trim() || undefined,
      date: dateISO,
      endDate: endDateISO,
      location: formLocation.value.trim() || undefined,
      meetingLink: formMeetingLink.value.trim() || undefined,
      type: formType.value,
      agendaItems: formAgendaItems.value.length > 0 ? formAgendaItems.value : undefined,
      displayOrder: formDisplayOrder.value,
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
  <div>
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

          <!-- Agenda (puntos) -->
          <div class="space-y-3">
            <Label>Puntos de agenda</Label>

            <!-- Items existentes -->
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

            <!-- Agregar nuevo punto -->
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

          <!-- Orden de visualización -->
          <div class="space-y-1.5">
            <Label for="meeting-order">Orden de visualización</Label>
            <Input
              id="meeting-order"
              v-model.number="formDisplayOrder"
              type="number"
              min="0"
              placeholder="0"
              class="h-12 text-base"
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
