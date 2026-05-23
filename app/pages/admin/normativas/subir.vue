<script setup lang="ts">
import { Loader2, Paperclip } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
useHead({ title: 'Subir Normativa' })

const router = useRouter()
const { isSubmitting, error, createRegulation } = useRegulations()

const formTitle = ref('')
const formPdfFile = ref<File | null>(null)
const pdfInputRef = ref<HTMLInputElement | null>(null)

const canSubmit = computed(() =>
  formTitle.value.trim().length > 0
  && formPdfFile.value !== null
  && !isSubmitting.value,
)

function handlePdfSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) formPdfFile.value = file
}

function clearPdf() {
  formPdfFile.value = null
  if (pdfInputRef.value) pdfInputRef.value.value = ''
}

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    const formData = new FormData()
    formData.append('title', formTitle.value.trim())
    if (formPdfFile.value) formData.append('attachment', formPdfFile.value)
    await createRegulation(formData)
    toast.success('Normativa publicada correctamente')
    router.push('/admin/normativas')
  }
  catch {
    toast.error(error.value ?? 'Error al subir normativa')
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
            <Label for="reg-title">Título <span class="text-destructive">*</span></Label>
            <Input
              id="reg-title"
              v-model="formTitle"
              placeholder="Ej: Normas de Convivencia 2026"
              class="h-12 text-base"
              required
            />
          </div>

          <!-- Archivo PDF -->
          <div class="space-y-1.5">
            <Label>Archivo PDF <span class="text-destructive">*</span></Label>
            <div class="flex items-center gap-3">
              <Button type="button" variant="outline" class="h-12" @click="pdfInputRef?.click()">
                <Paperclip class="mr-1.5 size-4" />
                {{ formPdfFile ? 'Cambiar PDF' : 'Seleccionar PDF' }}
              </Button>
              <input
                ref="pdfInputRef"
                type="file"
                accept="application/pdf"
                class="hidden"
                @change="handlePdfSelect"
              />
              <span v-if="formPdfFile" class="flex items-center gap-2 truncate text-sm text-muted-foreground">
                {{ formPdfFile.name }}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="size-6 shrink-0"
                  @click="clearPdf"
                >
                  <span class="text-xs">&times;</span>
                </Button>
              </span>
            </div>
            <p class="text-xs text-muted-foreground">Máximo 10MB. Solo archivos PDF.</p>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Subiendo...' : 'Publicar Normativa' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
