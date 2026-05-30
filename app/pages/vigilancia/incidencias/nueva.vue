<script setup lang="ts">
import { Camera, X, Loader2, EyeOff } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { IncidentPriority } from '~~/shared/types/incident'

useHead({ title: 'Reportar Incidencia' })

const router = useRouter()
const { isCreating, error, createIncident } = useIncidents()

const title = ref('')
const description = ref('')
const priority = ref<IncidentPriority>('medium')
const isAnonymous = ref(false)
const photos = ref<{ file: File, preview: string }[]>([])

const MAX_PHOTOS = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const canSubmit = computed(() =>
  title.value.trim().length > 0
  && description.value.trim().length > 0
  && !isCreating.value,
)

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files) return

  for (const file of Array.from(input.files)) {
    if (photos.value.length >= MAX_PHOTOS) {
      toast.error(`Máximo ${MAX_PHOTOS} fotos permitidas`)
      break
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG o WebP')
      continue
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('La imagen no puede superar 5MB')
      continue
    }
    photos.value.push({ file, preview: URL.createObjectURL(file) })
  }

  input.value = ''
}

function removePhoto(index: number) {
  const photo = photos.value[index]
  if (photo) URL.revokeObjectURL(photo.preview)
  photos.value.splice(index, 1)
}

async function handleSubmit() {
  if (!canSubmit.value) return

  const formData = new FormData()
  formData.append('title', title.value.trim())
  formData.append('description', description.value.trim())
  formData.append('priority', priority.value)
  formData.append('is_anonymous', String(isAnonymous.value))

  photos.value.forEach((photo, i) => {
    formData.append(`photo_${i}`, photo.file)
  })

  try {
    await createIncident(formData)
    toast.success('Incidencia reportada correctamente')
    router.push('/vigilancia/incidencias')
  }
  catch {
    toast.error(error.value ?? 'Error al reportar incidencia')
  }
}

onUnmounted(() => {
  photos.value.forEach(p => URL.revokeObjectURL(p.preview))
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
              placeholder="Ej: Tubería rota en el pasillo principal"
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
              placeholder="Describe el problema con detalle: ubicación, desde cuándo ocurre, etc."
              rows="4"
              class="text-base"
              required
            />
          </div>

          <!-- Priority -->
          <div class="space-y-1.5">
            <Label for="priority">Prioridad</Label>
            <Select v-model="priority">
              <SelectTrigger id="priority" size="lg" class="w-full text-base">
                <SelectValue placeholder="Selecciona prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja — No urgente</SelectItem>
                <SelectItem value="medium">Media — Requiere atención</SelectItem>
                <SelectItem value="high">Alta — Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Anonymous toggle -->
          <div class="flex items-center justify-between rounded-lg border p-3">
            <div class="flex items-center gap-2.5">
              <EyeOff class="size-4 text-muted-foreground" />
              <div>
                <p class="text-sm font-medium">Reportar como anónima</p>
                <p class="text-xs text-muted-foreground">Tu identidad solo será visible para la administración</p>
              </div>
            </div>
            <Switch v-model="isAnonymous" />
          </div>

          <!-- Photos -->
          <div class="space-y-1.5">
            <Label>Fotos <span class="text-xs text-muted-foreground">(opcional, máx. {{ MAX_PHOTOS }})</span></Label>

            <!-- Photo previews -->
            <div v-if="photos.length > 0" class="flex gap-2">
              <div
                v-for="(photo, index) in photos"
                :key="index"
                class="relative"
              >
                <img
                  :src="photo.preview"
                  :alt="`Foto ${index + 1}`"
                  class="size-24 rounded-lg border object-cover"
                >
                <button
                  type="button"
                  class="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-lg bg-destructive text-destructive-foreground shadow-sm"
                  @click="removePhoto(index)"
                >
                  <X class="size-3" />
                </button>
              </div>
            </div>

            <!-- Upload button -->
            <div v-if="photos.length < MAX_PHOTOS">
              <label
                class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                <Camera class="size-10 text-muted-foreground" />
                <span class="text-base text-muted-foreground">Toca para agregar foto</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
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
            {{ isCreating ? 'Enviando...' : 'Reportar incidencia' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
