<script setup lang="ts">
import { Loader2, Plus, X, Calendar } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

useHead({ title: 'Nueva Votación' })

const router = useRouter()
const { isSubmitting, error, createPoll } = usePolls()

// --- Form state ---
const formTitle = ref('')
const formDescription = ref('')
const formStatus = ref<'draft' | 'active'>('draft')
const formDeadline = ref('')
const formOptions = ref<string[]>(['', ''])

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
      deadline: formDeadline.value || undefined,
      options,
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
              <Label for="poll-deadline">Fecha límite</Label>
              <div class="relative">
                <Calendar class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="poll-deadline"
                  v-model="formDeadline"
                  type="date"
                  class="h-12 pl-9 text-base"
                />
              </div>
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
