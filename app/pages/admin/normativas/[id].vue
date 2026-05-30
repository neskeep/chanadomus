<script setup lang="ts">
import { Loader2, Paperclip } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

useHead({ title: 'Editar Normativa' })

const route = useRoute()
const router = useRouter()
const { regulations, isLoading, isSubmitting, error, fetchRegulations, updateRegulation } = useRegulations()

const formTitle = ref('')
const formPdfFile = ref<File | null>(null)
const pdfInputRef = ref<HTMLInputElement | null>(null)
const currentPdfName = ref('')

const canSubmit = computed(() =>
  formTitle.value.trim().length > 0
  && !isSubmitting.value,
)

// Load existing regulation
onMounted(async () => {
  await fetchRegulations()
  const regulation = regulations.value.find(r => r.id === route.params.id)
  if (!regulation) {
    toast.error('Normativa no encontrada')
    router.push('/admin/normativas')
    return
  }
  formTitle.value = regulation.title
  currentPdfName.value = regulation.attachmentPath
})

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
    await updateRegulation(route.params.id as string, formData)
    toast.success('Normativa actualizada')
    router.push('/admin/normativas')
  }
  catch {
    toast.error(error.value ?? 'Error al actualizar normativa')
  }
}
</script>

<template>
  <div>
    <!-- Loading -->
    <Card v-if="isLoading">
      <CardContent class="p-5 md:p-8">
        <div class="space-y-6">
          <Skeleton class="h-12 w-full" />
          <Skeleton class="h-12 w-full" />
          <Skeleton class="h-12 w-full" />
        </div>
      </CardContent>
    </Card>

    <Card v-else>
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
            <Label>Archivo PDF</Label>
            <div class="flex items-center gap-3">
              <Button type="button" variant="outline" class="h-12" @click="pdfInputRef?.click()">
                <Paperclip class="mr-1.5 size-4" />
                {{ formPdfFile ? 'Cambiar PDF' : 'Reemplazar PDF' }}
              </Button>
              <input
                ref="pdfInputRef"
                type="file"
                accept="application/pdf"
                class="hidden"
                @change="handlePdfSelect"
              >
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
              <span v-else class="truncate text-sm text-muted-foreground">
                PDF actual conservado
              </span>
            </div>
            <p class="text-xs text-muted-foreground">Opcional. Solo si deseas reemplazar el PDF actual.</p>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Guardando...' : 'Guardar Cambios' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
