<script setup lang="ts">
import { Camera, X, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { SupportTicketType, SupportTicketPriority } from '~~/shared/types/support'
import { SUPPORT_TYPE_LABELS, SUPPORT_PRIORITY_LABELS } from '~/composables/useColorMap'

useHead({ title: 'Nuevo Ticket' })

const router = useRouter()
const { isCreating, error, createTicket } = useSupportTickets()
const { compressImage } = useImageCompress()

const title = ref('')
const description = ref('')
const type = ref<SupportTicketType>('bug')
const priority = ref<SupportTicketPriority>('media')
const screenshots = ref<{ file: File; preview: string }[]>([])
const isCompressing = ref(false)

const MAX_SCREENSHOTS = 3
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB (after compression)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

const canSubmit = computed(() =>
  title.value.trim().length > 0
  && description.value.trim().length > 0
  && !isCreating.value
  && !isCompressing.value,
)

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files) return

  const files = Array.from(input.files)
  input.value = ''

  for (const rawFile of files) {
    if (screenshots.value.length >= MAX_SCREENSHOTS) {
      toast.error(`Máximo ${MAX_SCREENSHOTS} capturas permitidas`)
      break
    }
    if (!ALLOWED_TYPES.includes(rawFile.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG o WebP')
      continue
    }

    isCompressing.value = true
    try {
      const file = await compressImage(rawFile)
      if (file.size > MAX_FILE_SIZE) {
        toast.error('La imagen es demasiado grande incluso después de comprimir')
        continue
      }
      screenshots.value.push({ file, preview: URL.createObjectURL(file) })
    }
    catch {
      toast.error('Error al procesar la imagen')
    }
    finally {
      isCompressing.value = false
    }
  }
}

function removeScreenshot(index: number) {
  URL.revokeObjectURL(screenshots.value[index]!.preview)
  screenshots.value.splice(index, 1)
}

async function handleSubmit() {
  if (!canSubmit.value) return

  const formData = new FormData()
  formData.append('title', title.value.trim())
  formData.append('description', description.value.trim())
  formData.append('type', type.value)
  formData.append('priority', priority.value)
  formData.append('page_url', window.location.href)
  formData.append('user_agent', navigator.userAgent)

  screenshots.value.forEach((screenshot, i) => {
    formData.append(`screenshot_${i}`, screenshot.file)
  })

  try {
    await createTicket(formData)
    toast.success('Ticket enviado correctamente')
    router.push('/mi-chana/soporte')
  }
  catch {
    toast.error(error.value ?? 'Error al enviar ticket')
  }
}

onUnmounted(() => {
  screenshots.value.forEach(s => URL.revokeObjectURL(s.preview))
})
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-4">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Title -->
          <div class="space-y-1.5">
            <Label for="title">Título <span class="text-destructive">*</span></Label>
            <Input
              id="title"
              v-model="title"
              placeholder="Ej: No puedo acceder a la sección de pagos"
              class="h-12 text-base"
              maxlength="200"
              required
            />
            <p class="text-xs text-muted-foreground">{{ title.length }}/200</p>
          </div>

          <!-- Description -->
          <div class="space-y-1.5">
            <Label for="description">Descripción <span class="text-destructive">*</span></Label>
            <Textarea
              id="description"
              v-model="description"
              placeholder="Describe el problema o sugerencia con detalle"
              rows="4"
              class="text-base"
              required
            />
          </div>

          <!-- Type -->
          <div class="space-y-1.5">
            <Label for="type">Tipo</Label>
            <Select v-model="type">
              <SelectTrigger id="type" size="lg" class="w-full text-base">
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">{{ SUPPORT_TYPE_LABELS.bug }} — Algo no funciona</SelectItem>
                <SelectItem value="sugerencia">{{ SUPPORT_TYPE_LABELS.sugerencia }} — Idea de mejora</SelectItem>
                <SelectItem value="pregunta">{{ SUPPORT_TYPE_LABELS.pregunta }} — Necesito ayuda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Priority -->
          <div class="space-y-1.5">
            <Label for="priority">Prioridad</Label>
            <Select v-model="priority">
              <SelectTrigger id="priority" size="lg" class="w-full text-base">
                <SelectValue placeholder="Selecciona prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baja">{{ SUPPORT_PRIORITY_LABELS.baja }} — No urgente</SelectItem>
                <SelectItem value="media">{{ SUPPORT_PRIORITY_LABELS.media }} — Requiere atención</SelectItem>
                <SelectItem value="alta">{{ SUPPORT_PRIORITY_LABELS.alta }} — Urgente</SelectItem>
                <SelectItem value="critica">{{ SUPPORT_PRIORITY_LABELS.critica }} — Bloquea mi uso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Screenshots -->
          <div class="space-y-1.5">
            <Label>Capturas de pantalla <span class="text-xs text-muted-foreground">(opcional, máx. {{ MAX_SCREENSHOTS }})</span></Label>

            <!-- Screenshot previews -->
            <div v-if="screenshots.length > 0" class="flex gap-2">
              <div
                v-for="(screenshot, index) in screenshots"
                :key="index"
                class="relative"
              >
                <img
                  :src="screenshot.preview"
                  :alt="`Captura ${index + 1}`"
                  class="size-24 rounded-lg border object-cover"
                >
                <button
                  type="button"
                  class="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-lg bg-destructive text-destructive-foreground shadow-sm"
                  @click="removeScreenshot(index)"
                >
                  <X class="size-3" />
                </button>
              </div>
            </div>

            <!-- Upload button -->
            <div v-if="screenshots.length < MAX_SCREENSHOTS">
              <label
                class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                <Camera class="size-10 text-muted-foreground" />
                <span class="text-base text-muted-foreground">Toca para agregar captura</span>
                <span class="text-xs text-muted-foreground/70">JPG, PNG, WebP o HEIC — max. 10 MB por imagen</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                  multiple
                  class="hidden"
                  @change="onFileChange"
                >
              </label>
            </div>
          </div>

          <!-- Submit -->
          <Button type="submit" class="mt-3 h-12 w-full text-base font-semibold" :disabled="!canSubmit">
            <Loader2 v-if="isCreating" class="size-4 animate-spin" />
            {{ isCreating ? 'Enviando...' : 'Enviar ticket' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
