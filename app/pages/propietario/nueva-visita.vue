<script setup lang="ts">
import { Loader2, Share2, Plus, QrCode, Users } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { VisitorType } from '~~/shared/types/qr'
import QRCode from 'qrcode'

useHead({ title: 'Nueva Visita' })

const route = useRoute()
const { user } = useAuth()
const { generateQr, isGenerating, error } = useQr()
const { visitors: frequentVisitors, fetchVisitors: fetchFrequentVisitors, addVisitor: addFrequentVisitor } = useFrequentVisitors()

// Form state
const visitorName = ref('')
const visitorDocument = ref('')
const visitorType = ref<VisitorType>('invitado')
const frequentVisitorId = ref<string | null>(null)
const showFrequentPicker = ref(false)
const saveAsFrequent = ref(false)

// Computed ISO string for submission — fixed 24h from now
const expiresAtISO = computed(() => {
  const expires = new Date()
  expires.setHours(expires.getHours() + 24)
  return expires.toISOString()
})

// Result state
const generatedToken = ref<string | null>(null)
const generatedData = ref<{
  visitorName: string
  visitorType: VisitorType
  expiresAt: string
} | null>(null)
const qrDataUrl = ref<string | null>(null)
const shareSuccess = ref<string | null>(null)

onMounted(() => {
  // Pre-fill from frequent visitor query params
  if (route.query.nombre) {
    visitorName.value = route.query.nombre as string
    visitorDocument.value = (route.query.cedula as string) || ''
    const tipo = route.query.tipo as string
    if (tipo === 'invitado' || tipo === 'proveedor') {
      visitorType.value = tipo
    }
    frequentVisitorId.value = (route.query.fid as string) || null
  }
  fetchFrequentVisitors()
})

function selectFrequent(visitor: { id: string; visitorName: string; visitorDocument: string | null; visitorType: string }) {
  visitorName.value = visitor.visitorName
  visitorDocument.value = visitor.visitorDocument ?? ''
  visitorType.value = (visitor.visitorType === 'proveedor' ? 'proveedor' : 'invitado') as VisitorType
  frequentVisitorId.value = visitor.id
  showFrequentPicker.value = false
}

const userUnitId = computed(() => (user.value as Record<string, unknown> | null)?.unitId as string | undefined)

const isFormValid = computed(() => {
  return visitorName.value.trim() !== ''
    && visitorDocument.value.trim() !== ''
    && !!userUnitId.value
})

async function handleGenerate() {
  if (!isFormValid.value) return

  shareSuccess.value = null

  try {
    const result = await generateQr({
      visitorName: visitorName.value.trim(),
      visitorDocument: visitorDocument.value.trim() || undefined,
      visitorType: visitorType.value,
      unitId: userUnitId.value!,
      expiresAt: expiresAtISO.value,
      frequentVisitorId: frequentVisitorId.value || undefined,
    })

    generatedToken.value = result.token
    generatedData.value = {
      visitorName: result.visitorName,
      visitorType: result.visitorType,
      expiresAt: result.expiresAt,
    }

    const accessUrl = `${window.location.origin}/acceso/${result.token}`
    qrDataUrl.value = await QRCode.toDataURL(accessUrl, { width: 256, margin: 2 })

    // Save as frequent visitor if requested
    if (saveAsFrequent.value && !frequentVisitorId.value && userUnitId.value) {
      try {
        await addFrequentVisitor({
          visitorName: visitorName.value.trim(),
          visitorDocument: visitorDocument.value.trim() || undefined,
          visitorType: visitorType.value,
          unitId: userUnitId.value,
        })
        toast.success('Visitante guardado como frecuente')
      }
      catch (err) {
        console.warn('[nueva-visita] Error al guardar visitante frecuente:', err)
        toast.error('No se pudo guardar como visitante frecuente')
      }
    }
  }
  catch {
    // Error is already set in composable
  }
}

async function handleShare() {
  if (!generatedToken.value) return

  const accessUrl = `${window.location.origin}/acceso/${generatedToken.value}`
  const shareText = `Hola! Te comparto tu acceso a Ranchos de Chana. Muestra este enlace en la alcabala: ${accessUrl}`

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Acceso Ranchos de Chana',
        text: shareText,
        url: accessUrl,
      })
    }
    catch (err: unknown) {
      // User cancelled share -- silently ignore AbortError
      if (err instanceof Error && err.name !== 'AbortError') {
        await copyToClipboard(shareText)
      }
    }
  }
  else {
    await copyToClipboard(shareText)
  }
}

async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    }
    else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    shareSuccess.value = 'Enlace copiado al portapapeles'
    setTimeout(() => { shareSuccess.value = null }, 3000)
  }
  catch {
    shareSuccess.value = 'No se pudo copiar el enlace'
    setTimeout(() => { shareSuccess.value = null }, 3000)
  }
}

function handleReset() {
  visitorName.value = ''
  visitorDocument.value = ''
  visitorType.value = 'invitado'
  frequentVisitorId.value = null
  saveAsFrequent.value = false
  showFrequentPicker.value = false
  generatedToken.value = null
  generatedData.value = null
  qrDataUrl.value = null
  shareSuccess.value = null
  error.value = null
}

const { formatDateTime } = useFormatDate()
</script>

<template>
  <div>
    <!-- Error alert -->
    <ErrorAlert :message="error" class="mb-4" />

    <!-- Form (hidden after generation) -->
    <form v-if="!generatedToken" @submit.prevent="handleGenerate">
      <!-- Frequent visitors selector -->
      <div v-if="frequentVisitors.length > 0" class="mb-4">
        <Button
          v-if="!showFrequentPicker"
          type="button"
          variant="outline"
          class="h-10 w-full text-sm"
          @click="showFrequentPicker = true"
        >
          <Users class="size-4" />
          Seleccionar visitante frecuente
        </Button>
        <Card v-else>
          <CardContent class="p-3">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium">Visitantes frecuentes</span>
              <Button type="button" variant="ghost" size="sm" @click="showFrequentPicker = false">
                Cerrar
              </Button>
            </div>
            <div class="space-y-1">
              <button
                v-for="fv in frequentVisitors"
                :key="fv.id"
                type="button"
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
                @click="selectFrequent(fv)"
              >
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ fv.visitorName }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ fv.visitorDocument ?? 'Sin cédula' }}
                    <span v-if="fv.visitCount"> · {{ fv.visitCount }} visitas</span>
                  </p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
      <CardContent class="space-y-6 p-4">
        <!-- Nombre del visitante (full width) -->
        <div class="space-y-1.5">
          <Label for="visitor-name">Nombre del visitante <span class="text-destructive">*</span></Label>
          <Input
            id="visitor-name"
            v-model="visitorName"
            placeholder="Nombre completo"
            required
            class="h-12 text-base"
          />
        </div>

        <!-- Cédula | Tipo (row) -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <Label for="visitor-document">Cédula <span class="text-destructive">*</span></Label>
            <Input
              id="visitor-document"
              v-model="visitorDocument"
              placeholder="V-12345678"
              required
              class="h-12 text-base"
            />
          </div>
          <div class="space-y-1.5">
            <Label for="visitor-type">Tipo de visita</Label>
            <Select v-model="visitorType">
              <SelectTrigger id="visitor-type" size="lg" class="w-full text-base">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invitado">Invitado</SelectItem>
                <SelectItem value="proveedor">Proveedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Validity info + save as frequent -->
        <div class="space-y-3">
          <p class="text-sm text-muted-foreground">
            El pase será válido por 24 horas a partir de su creación.
          </p>

          <div v-if="!frequentVisitorId" class="flex items-center gap-2">
            <Checkbox id="save-frequent" :checked="saveAsFrequent" @click="saveAsFrequent = !saveAsFrequent" />
            <Label for="save-frequent" class="text-sm font-normal text-muted-foreground">Guardar como visitante frecuente</Label>
          </div>
        </div>

        <!-- Submit -->
        <Button
          type="submit"
          class="mt-3 h-12 w-full text-base font-semibold"
          :disabled="!isFormValid || isGenerating"
        >
          <Loader2 v-if="isGenerating" class="size-4 animate-spin" />
          <QrCode v-else class="size-4" />
          {{ isGenerating ? 'Creando...' : 'Crear pase de acceso' }}
        </Button>
      </CardContent>
      </Card>
    </form>

    <!-- Result -->
    <div v-else class="space-y-4">
      <Card>
        <CardContent class="flex flex-col items-center space-y-4 p-4">
          <!-- QR Image -->
          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            alt="Pase de acceso"
            class="size-64 rounded-lg"
          />

          <Separator />

          <!-- Visitor info -->
          <div class="w-full space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Visitante</span>
              <span class="font-medium">{{ generatedData?.visitorName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Tipo</span>
              <Badge variant="secondary">
                {{ generatedData?.visitorType === 'invitado' ? 'Invitado' : 'Proveedor' }}
              </Badge>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Válido hasta</span>
              <span class="text-xs">{{ generatedData ? formatDateTime(generatedData.expiresAt) : '' }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Share success -->
      <div
        v-if="shareSuccess"
        role="status"
        class="rounded-lg border border-primary/50 bg-primary/10 p-3 text-center text-sm text-primary"
      >
        {{ shareSuccess }}
      </div>

      <!-- Actions -->
      <div class="space-y-3">
        <Button class="h-12 w-full text-base" @click="handleShare">
          <Share2 class="size-4" />
          Compartir con tu visitante
        </Button>
        <Button variant="outline" class="h-12 w-full text-base" @click="handleReset">
          <Plus class="size-4" />
          Crear otro pase
        </Button>
      </div>
    </div>
  </div>
</template>
