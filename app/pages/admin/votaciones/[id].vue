<script setup lang="ts">
import { Loader2, CalendarIcon } from 'lucide-vue-next'
import { CalendarDate } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const {
  isLoading,
  isSubmitting,
  error,
  fetchPoll,
  updatePoll,
} = usePolls()

useHead({ title: 'Editar Votación' })

// --- Form state ---
const formTitle = ref('')
const formDescription = ref('')
const formStatus = ref<'draft' | 'active'>('draft')
const formDeadline = shallowRef<DateValue | undefined>(undefined)
const deadlinePickerOpen = ref(false)
const formDisplayOrder = ref(0)
const loaded = ref(false)

function dateToISO(d: DateValue): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

function formatPickerDate(d: DateValue): string {
  const date = new Date(d.year, d.month - 1, d.day)
  return date.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })
}

function parseISODate(iso: string): CalendarDate {
  const [y, m, d] = iso.split('T')[0]!.split('-').map(Number)
  return new CalendarDate(y!, m!, d!)
}

const canSubmit = computed(() =>
  formTitle.value.trim().length > 0 && !isSubmitting.value,
)

async function loadPoll() {
  try {
    const poll = await fetchPoll(id)
    formTitle.value = poll.title
    formDescription.value = poll.description ?? ''
    formStatus.value = poll.status === 'closed' ? 'draft' : poll.status as 'draft' | 'active'
    formDeadline.value = poll.deadline ? parseISODate(poll.deadline) : undefined
    formDisplayOrder.value = poll.displayOrder ?? 0
    loaded.value = true
  }
  catch {
    // error is set by composable
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    await updatePoll(id, {
      title: formTitle.value.trim(),
      description: formDescription.value.trim() || null,
      status: formStatus.value,
      deadline: formDeadline.value ? dateToISO(formDeadline.value) : null,
      displayOrder: formDisplayOrder.value,
    })
    toast.success('Votación actualizada correctamente')
    router.push('/admin/votaciones')
  }
  catch {
    toast.error(error.value ?? 'Error al guardar votación')
  }
}

onMounted(() => {
  loadPoll()
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading && !loaded" class="space-y-4">
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-24 w-full" />
      <Skeleton class="h-12 w-1/2" />
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
            {{ isSubmitting ? 'Guardando...' : 'Guardar cambios' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
