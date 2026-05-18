<script setup lang="ts">
import { Loader2, Paperclip, Calendar } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { AnnouncementCategory, AnnouncementStatus } from '~~/shared/types/announcement'

useHead({ title: 'Nuevo Anuncio' })

const router = useRouter()
const { isSubmitting, error, createAnnouncement } = useAnnouncements()

// --- Form state ---
const formTitle = ref('')
const formBody = ref('')
const formCategory = ref<AnnouncementCategory>('general')
const formStatus = ref<AnnouncementStatus>('draft')
const formExpiresAt = ref('')
const formPdfFile = ref<File | null>(null)
const pdfInputRef = ref<HTMLInputElement | null>(null)

const canSubmit = computed(() =>
  formTitle.value.trim().length > 0
  && formBody.value.trim().length > 0
  && !isSubmitting.value,
)

function handlePdfSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) formPdfFile.value = file
}

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    const formData = new FormData()
    formData.append('title', formTitle.value.trim())
    formData.append('body', formBody.value.trim())
    formData.append('category', formCategory.value)
    formData.append('status', formStatus.value)
    if (formExpiresAt.value) formData.append('expires_at', formExpiresAt.value)
    if (formPdfFile.value) formData.append('attachment', formPdfFile.value)
    await createAnnouncement(formData)
    toast.success('Anuncio creado correctamente')
    router.push('/admin/cartelera')
  }
  catch {
    toast.error(error.value ?? 'Error al crear anuncio')
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
            <Label for="ann-title">Título <span class="text-destructive">*</span></Label>
            <Input
              id="ann-title"
              v-model="formTitle"
              placeholder="Título del anuncio"
              class="h-12 text-base"
              required
            />
          </div>

          <!-- Cuerpo -->
          <div class="space-y-1.5">
            <Label for="ann-body">Contenido <span class="text-destructive">*</span></Label>
            <Textarea
              id="ann-body"
              v-model="formBody"
              placeholder="Contenido del anuncio..."
              rows="6"
              class="text-base"
              required
            />
          </div>

          <!-- Categoría + Estado row -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="ann-category">Categoría</Label>
              <Select v-model="formCategory">
                <SelectTrigger id="ann-category" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="seguridad">Seguridad</SelectItem>
                  <SelectItem value="financiero">Financiero</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label for="ann-status">Estado</Label>
              <Select v-model="formStatus">
                <SelectTrigger id="ann-status" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Adjunto PDF + Fecha de expiración row -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label>Adjunto PDF</Label>
              <div class="flex items-center gap-3">
                <Button type="button" variant="outline" class="h-12" @click="pdfInputRef?.click()">
                  <Paperclip class="mr-1.5 size-4" />
                  {{ formPdfFile ? 'Cambiar' : 'Seleccionar PDF' }}
                </Button>
                <input
                  ref="pdfInputRef"
                  type="file"
                  accept="application/pdf"
                  class="hidden"
                  @change="handlePdfSelect"
                />
                <span v-if="formPdfFile" class="truncate text-sm text-muted-foreground">
                  {{ formPdfFile.name }}
                </span>
              </div>
            </div>
            <div class="space-y-1.5">
              <Label for="ann-expires">Fecha de expiración</Label>
              <div class="relative">
                <Calendar class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="ann-expires"
                  v-model="formExpiresAt"
                  type="date"
                  class="h-12 pl-9 text-base"
                />
              </div>
              <p class="text-xs text-muted-foreground">Se archiva automáticamente en esta fecha</p>
            </div>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Creando...' : 'Crear Anuncio' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
