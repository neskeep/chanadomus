<script setup lang="ts">
import { Loader2, Calendar } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { PollStatus } from '~~/shared/types/poll'

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
const formDeadline = ref('')
const loaded = ref(false)

const canSubmit = computed(() =>
  formTitle.value.trim().length > 0 && !isSubmitting.value,
)

async function loadPoll() {
  try {
    const poll = await fetchPoll(id)
    formTitle.value = poll.title
    formDescription.value = poll.description ?? ''
    formStatus.value = poll.status === 'closed' ? 'draft' : poll.status as 'draft' | 'active'
    formDeadline.value = poll.deadline?.split('T')[0] ?? ''
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
      deadline: formDeadline.value || null,
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
            {{ isSubmitting ? 'Guardando...' : 'Guardar cambios' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
