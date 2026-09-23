<script setup lang="ts">
import { CalendarDays, CalendarIcon, Loader2, QrCode, Save, Users } from 'lucide-vue-next'
import type { DateValue } from 'reka-ui'
import type {
  FrequentVisitorOption,
  VisitPassFormInitial,
  VisitPassFormMode,
  VisitPassFormValues,
} from '~/composables/useVisitPassForm'

/**
 * Formulario de pase de visita para crear y editar. Solo presenta: el estado
 * vive en useVisitPassForm y la página decide qué hacer con `submit`.
 * Los valores iniciales se leen al montar: cambia la `key` para reiniciarlo.
 */
interface Props {
  mode: VisitPassFormMode
  initial?: VisitPassFormInitial
  frequentVisitors?: Array<FrequentVisitorOption & { visitCount?: number | null }>
  isSubmitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initial: () => ({}),
  frequentVisitors: () => [],
  isSubmitting: false,
})

const emit = defineEmits<{
  submit: [values: VisitPassFormValues]
}>()

const {
  visitorName,
  visitorDocument,
  visitorType,
  frequentVisitorId,
  saveAsFrequent,
  duration,
  customDate,
  durationOptions,
  isMultiUse,
  canSubmit,
  hasChanges,
  selectFrequent,
  values,
} = useVisitPassForm(props.mode, props.initial)

const { formatDateTime } = useFormatDate()

const isEdit = computed(() => props.mode === 'edit')
const showFrequentPicker = ref(false)
const customDatePickerOpen = ref(false)

function pickFrequent(visitor: FrequentVisitorOption) {
  selectFrequent(visitor)
  showFrequentPicker.value = false
}

function formatPickerDate(d: DateValue): string {
  const date = new Date(d.year, d.month - 1, d.day)
  return date.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function onPickDate(v: DateValue | undefined) {
  if (!v) return
  customDate.value = v
  customDatePickerOpen.value = false
}

const durationHint = computed(() => {
  if (duration.value === 'keep' && props.initial.expiresAt) {
    const until = formatDateTime(props.initial.expiresAt)
    return isMultiUse.value
      ? `Válido hasta el ${until}, con varias entradas y salidas.`
      : `Válido hasta el ${until}, para una sola entrada.`
  }
  return isMultiUse.value
    ? 'El pase permitirá varias entradas y salidas durante el período elegido.'
    : 'El pase sirve para una sola entrada y vence en 24 horas.'
})

const submitLabel = computed(() => {
  if (isEdit.value) return props.isSubmitting ? 'Guardando...' : 'Guardar cambios'
  return props.isSubmitting ? 'Creando...' : 'Crear pase de acceso'
})

function handleSubmit() {
  if (!canSubmit.value || props.isSubmitting) return
  emit('submit', values())
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <!-- Visitantes frecuentes (solo al crear) -->
    <div v-if="!isEdit && frequentVisitors.length > 0" class="mb-4">
      <Button
        v-if="!showFrequentPicker"
        type="button"
        variant="outline"
        class="h-11 w-full text-base"
        @click="showFrequentPicker = true"
      >
        <Users class="size-4" />
        Elegir un visitante frecuente
      </Button>
      <Card v-else>
        <CardContent class="p-3">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-base font-medium">Visitantes frecuentes</span>
            <Button type="button" variant="ghost" class="h-11 md:h-9" @click="showFrequentPicker = false">
              Cerrar
            </Button>
          </div>
          <div class="space-y-1">
            <Button
              v-for="fv in frequentVisitors"
              :key="fv.id"
              type="button"
              variant="ghost"
              class="h-auto min-h-11 w-full justify-start rounded-lg px-3 py-2 text-left"
              @click="pickFrequent(fv)"
            >
              <span class="min-w-0 flex-1">
                <span class="block truncate text-base font-medium">{{ fv.visitorName }}</span>
                <span class="block text-sm font-normal text-muted-foreground">
                  {{ fv.visitorDocument ?? 'Sin cédula' }}<template v-if="fv.visitCount">, {{ fv.visitCount }} visitas</template>
                </span>
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardContent class="space-y-6 p-4">
        <div class="space-y-1.5">
          <Label for="visitor-name">Nombre del visitante <span class="text-destructive" aria-hidden="true">*</span></Label>
          <Input
            id="visitor-name"
            v-model="visitorName"
            placeholder="Nombre completo"
            required
            autocomplete="off"
            class="h-12 text-base"
          />
        </div>

        <div class="grid gap-4" :class="isEdit ? 'grid-cols-1' : 'grid-cols-2'">
          <div class="space-y-1.5">
            <Label for="visitor-document">Cédula <span class="text-destructive" aria-hidden="true">*</span></Label>
            <Input
              id="visitor-document"
              v-model="visitorDocument"
              placeholder="V-12345678"
              required
              autocomplete="off"
              class="h-12 text-base"
            />
          </div>
          <div v-if="!isEdit" class="space-y-1.5">
            <Label for="visitor-type">Tipo de visita</Label>
            <Select v-model="visitorType">
              <SelectTrigger id="visitor-type" size="lg" class="w-full text-base">
                <SelectValue placeholder="Elegir tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invitado">Invitado</SelectItem>
                <SelectItem value="proveedor">Proveedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-3">
          <div class="space-y-1.5">
            <Label for="duration">
              <CalendarDays class="inline size-3.5" aria-hidden="true" />
              {{ isEdit ? 'Vigencia del pase' : 'Duración del pase' }}
            </Label>
            <Select v-model="duration">
              <SelectTrigger id="duration" size="lg" class="w-full text-base">
                <SelectValue placeholder="Elegir duración" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in durationOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div v-if="duration === 'custom'" class="space-y-1.5">
            <Label for="custom-date">Válido hasta</Label>
            <Popover v-model:open="customDatePickerOpen">
              <PopoverTrigger as-child>
                <Button id="custom-date" type="button" variant="outline" class="h-12 w-full justify-start rounded-lg text-base font-normal">
                  <CalendarIcon class="mr-2 size-4 shrink-0 text-muted-foreground" />
                  <span class="truncate">{{ customDate ? formatPickerDate(customDate) : 'Elegir fecha' }}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0" align="start">
                <Calendar :model-value="customDate" locale="es" @update:model-value="onPickDate" />
              </PopoverContent>
            </Popover>
          </div>

          <p class="text-sm text-muted-foreground">{{ durationHint }}</p>

          <div v-if="!isEdit && !frequentVisitorId" class="flex min-h-11 items-center gap-2">
            <Checkbox id="save-frequent" :model-value="saveAsFrequent" @update:model-value="saveAsFrequent = !saveAsFrequent" />
            <Label for="save-frequent" class="text-sm font-normal text-muted-foreground">Guardar como visitante frecuente</Label>
          </div>
        </div>

        <div class="space-y-3">
          <Button
            type="submit"
            class="mt-3 h-12 w-full text-base font-semibold"
            :disabled="!canSubmit || isSubmitting"
          >
            <Loader2 v-if="isSubmitting" class="size-4 animate-spin" />
            <Save v-else-if="isEdit" class="size-4" />
            <QrCode v-else class="size-4" />
            {{ submitLabel }}
          </Button>
          <p v-if="isEdit && !hasChanges" class="text-center text-sm text-muted-foreground">
            Cambia algún dato para poder guardar.
          </p>
          <slot name="actions" />
        </div>
      </CardContent>
    </Card>
  </form>
</template>
