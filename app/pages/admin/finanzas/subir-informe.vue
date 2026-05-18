<script setup lang="ts">
import { Upload, FileText, Loader2, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

useHead({ title: 'Subir Informe' })

const router = useRouter()
const { isUploading, error, uploadReport } = useFinancialReports()

// --- Form state ---
const reportTitle = ref('')
const reportMonth = ref('')
const reportYear = ref(new Date().getFullYear().toString())
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const canSubmit = computed(() =>
  reportTitle.value.trim().length > 0
  && reportMonth.value
  && reportYear.value
  && selectedFile.value
  && !isUploading.value,
)

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.type !== 'application/pdf') {
    toast.error('Solo se permiten archivos PDF')
    input.value = ''
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error('El archivo no puede superar 10 MB')
    input.value = ''
    return
  }

  selectedFile.value = file
}

function removeFile() {
  selectedFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function handleSubmit() {
  if (!canSubmit.value || !selectedFile.value) return

  const formData = new FormData()
  formData.append('title', reportTitle.value.trim())
  formData.append('month', reportMonth.value)
  formData.append('year', reportYear.value)
  formData.append('file', selectedFile.value)

  try {
    await uploadReport(formData)
    toast.success('Informe subido correctamente')
    router.push('/admin/finanzas')
  }
  catch {
    toast.error(error.value ?? 'Error al subir informe')
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

          <!-- Title -->
          <div class="space-y-1.5">
            <Label for="report-title">Título del informe <span class="text-destructive">*</span></Label>
            <Input
              id="report-title"
              v-model="reportTitle"
              type="text"
              placeholder="Ej: Informe financiero mensual"
              class="h-12 text-base"
              maxlength="200"
            />
            <p class="text-xs text-muted-foreground">{{ reportTitle.length }}/200</p>
          </div>

          <!-- Month + Year row -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label for="report-month">Mes <span class="text-destructive">*</span></Label>
              <Select v-model="reportMonth">
                <SelectTrigger id="report-month" size="lg" class="text-base">
                  <SelectValue placeholder="Selecciona mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="(mes, index) in meses"
                    :key="index"
                    :value="String(index + 1)"
                  >
                    {{ mes }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5">
              <Label for="report-year">Año <span class="text-destructive">*</span></Label>
              <Input
                id="report-year"
                v-model="reportYear"
                type="number"
                :min="2020"
                :max="2030"
                class="h-12 text-base"
              />
            </div>
          </div>

          <!-- File upload -->
          <div class="space-y-1.5">
            <Label>Archivo PDF <span class="text-destructive">*</span></Label>

            <!-- Selected file preview -->
            <div
              v-if="selectedFile"
              class="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
            >
              <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText class="size-5 text-muted-foreground" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ selectedFile.name }}</p>
                <p class="text-xs text-muted-foreground">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <button
                type="button"
                class="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                @click="removeFile"
              >
                <X class="size-4" />
              </button>
            </div>

            <!-- Dropzone -->
            <label
              v-else
              class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
            >
              <Upload class="size-8 text-muted-foreground" />
              <div class="text-center">
                <p class="text-sm font-medium text-muted-foreground">Toca para seleccionar archivo</p>
                <p class="mt-0.5 text-xs text-muted-foreground">PDF, máximo 10 MB</p>
              </div>
              <input
                ref="fileInputRef"
                type="file"
                accept=".pdf,application/pdf"
                class="hidden"
                @change="onFileChange"
              />
            </label>
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isUploading" class="mr-2 size-4 animate-spin" />
            <Upload v-else class="mr-2 size-4" />
            {{ isUploading ? 'Subiendo...' : 'Subir Informe' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
