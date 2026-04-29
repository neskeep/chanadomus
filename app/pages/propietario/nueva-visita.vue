<script setup lang="ts">
import { Loader2, Share2, Plus, QrCode } from 'lucide-vue-next'
import type { VisitorType } from '~~/shared/types/qr'
import QRCode from 'qrcode'

useHead({ title: 'Nueva Visita' })

const pageOverride = computed(() => ({
  breadcrumbs: [{ label: 'Mis Visitas', to: '/propietario/mis-visitas' }],
}))
usePageInfoOverride(pageOverride)
const { user } = useAuth()
const { generateQr, isGenerating, error } = useQr()

// Form state
const visitorName = ref('')
const visitorDocument = ref('')
const visitorType = ref<VisitorType>('invitado')
const expiresAt = ref('')

// Result state
const generatedToken = ref<string | null>(null)
const generatedData = ref<{
  visitorName: string
  visitorType: VisitorType
  expiresAt: string
} | null>(null)
const qrDataUrl = ref<string | null>(null)
const shareSuccess = ref<string | null>(null)

// Set default expiration to +24h
function getDefault24h(): string {
  const date = new Date()
  date.setHours(date.getHours() + 24)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

onMounted(() => {
  expiresAt.value = getDefault24h()
})

const userUnitId = computed(() => (user.value as Record<string, unknown> | null)?.unitId as string | undefined)

const isFormValid = computed(() => {
  return visitorName.value.trim() !== ''
    && !!userUnitId.value
    && expiresAt.value !== ''
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
      expiresAt: new Date(expiresAt.value).toISOString(),
    })

    generatedToken.value = result.token
    generatedData.value = {
      visitorName: result.visitorName,
      visitorType: result.visitorType,
      expiresAt: result.expiresAt,
    }

    const accessUrl = `${window.location.origin}/acceso/${result.token}`
    qrDataUrl.value = await QRCode.toDataURL(accessUrl, { width: 256, margin: 2 })
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
  expiresAt.value = getDefault24h()
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
    <Card v-if="!generatedToken">
      <CardContent class="space-y-5 p-4">
        <!-- Nombre del visitante -->
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

        <!-- Cédula -->
        <div class="space-y-1.5">
          <Label for="visitor-document">Cédula <span class="text-xs text-muted-foreground">(opcional)</span></Label>
          <Input
            id="visitor-document"
            v-model="visitorDocument"
            placeholder="V-12345678"
            class="h-12 text-base"
          />
        </div>

        <!-- Tipo de visitante -->
        <div class="space-y-1.5">
          <Label for="visitor-type">Tipo de visita</Label>
          <Select v-model="visitorType">
            <SelectTrigger id="visitor-type" class="h-12 w-full text-base">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invitado">Invitado</SelectItem>
              <SelectItem value="proveedor">Proveedor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Fecha y hora límite -->
        <div class="space-y-1.5">
          <Label for="expires-at">Válido hasta <span class="text-destructive">*</span></Label>
          <Input
            id="expires-at"
            v-model="expiresAt"
            type="datetime-local"
            class="h-12 text-base"
          />
        </div>

        <!-- Submit -->
        <Button
          class="mt-3 h-12 w-full text-base font-semibold"
          :disabled="!isFormValid || isGenerating"
          @click="handleGenerate"
        >
          <Loader2 v-if="isGenerating" class="size-4 animate-spin" />
          <QrCode v-else class="size-4" />
          {{ isGenerating ? 'Creando...' : 'Crear pase de acceso' }}
        </Button>
      </CardContent>
    </Card>

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
