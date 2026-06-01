<script setup lang="ts">
import { Loader2, Plus, X, CalendarIcon } from 'lucide-vue-next'
import type { DateValue } from 'reka-ui'
import { toast } from 'vue-sonner'

useHead({ title: 'Nueva Votación' })

const router = useRouter()
const { isSubmitting, error, createPoll } = usePolls()

// --- Form state ---
const formTitle = ref('')
const formDescription = ref('')
const formStatus = ref<'draft' | 'active'>('draft')
const formDeadline = shallowRef<DateValue | undefined>(undefined)
const deadlinePickerOpen = ref(false)
const formOptions = ref<string[]>(['', ''])
const formDisplayOrder = ref(0)

function dateToISO(d: DateValue): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

function formatPickerDate(d: DateValue): string {
  const date = new Date(d.year, d.month - 1, d.day)
  return date.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })
}

const canSubmit = computed(() => {
  const hasTitle = formTitle.value.trim().length > 0
  const validOptions = formOptions.value.filter(o => o.trim().length > 0)
  return hasTitle && validOptions.length >= 2 && !isSubmitting.value
})

function addOption() {
  formOptions.value.push('')
}

function removeOption(index: number) {
  if (formOptions.value.length <= 2) return
  formOptions.value.splice(index, 1)
}

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    const options = formOptions.value.filter(o => o.trim().length > 0)
    await createPoll({
      title: formTitle.value.trim(),
      description: formDescription.value.trim() || undefined,
      status: formStatus.value,
      deadline: formDeadline.value ? dateToISO(formDeadline.value) : undefined,
      options,
      displayOrder: formDisplayOrder.value,
    })
    toast.success('Votación creada correctamente')
    router.push('/admin/votaciones')
  }
  catch {
    toast.error(error.value ?? 'Error al crear votación')
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
            <Label for="poll-title">Título <span class="text-destructive">*</span></Label>
            <Input
              id="poll-title"
              v-model="formTitle"
              placeholder="Título de la votación"
              class="h-12 text-base"
              required
            />
          </div>

          <!-- Descripción -->
          <div class="space-y-1.5">
            <Label for="poll-description">Descripción</Label>
            <Textarea
              id="poll-description"
              v-model="formDescription"
              placeholder="Descripción de la votación..."
              rows="3"
              class="text-base"
            />
          </div>

          <!-- Opciones de voto -->
          <div class="space-y-1.5">
            <Label>Opciones de voto <span class="text-destructive">*</span></Label>
            <div class="space-y-2">
              <div v-for="(_, index) in formOptions" :key="index" class="flex gap-2">
                <Input
                  v-model="formOptions[index]"
                  :placeholder="`Opción ${index + 1}`"
                  class="h-12 flex-1 text-base"
                  required
                />
                <Button
                  v-if="formOptions.length > 2"
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="size-12 shrink-0 text-muted-foreground hover:text-destructive"
                  @click="removeOption(index)"
                >
                  <X class="size-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                class="h-12 w-full text-base"
                @click="addOption"
              >
                <Plus class="mr-1.5 size-4" />
                Agregar opción
              </Button>
            </div>
            <p class="text-xs text-muted-foreground">Mínimo 2 opciones requeridas</p>
          </div>

          <!-- Fecha límite + Estado row -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label>Fecha límite</Label>
              <Popover v-model:open="deadlinePickerOpen">
                <PopoverTrigger as-child>
                  <Button variant="outline" class="h-12 w-full justify-start rounded-lg text-base font-normal">
                    <CalendarIcon class="mr-2 size-4 shrink-0 text-muted-foreground" />
                    <span class="truncate">{{ formDeadline ? formatPickerDate(formDeadline) : 'Seleccionar fecha' }}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar
                    :model-value="formDeadline"
                    locale="es"
                    @update:model-value="(v: DateValue | undefined) => { if (v) { formDeadline = v; deadlinePickerOpen = false } }"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div class="space-y-1.5">
              <Label for="poll-status">Estado</Label>
              <Select v-model="formStatus">
                <SelectTrigger id="poll-status" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="active">Activa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Orden de visualización -->
          <div class="space-y-1.5">
            <Label for="poll-order">Orden de visualización</Label>
            <Input
              id="poll-order"
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
            {{ isSubmitting ? 'Creando...' : 'Crear Votación' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
