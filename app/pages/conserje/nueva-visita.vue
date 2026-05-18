<script setup lang="ts">
import { Loader2, Share2, Plus, QrCode, CalendarIcon, Clock } from 'lucide-vue-next'
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import type { VisitorType } from '~~/shared/types/qr'
import QRCode from 'qrcode'

useHead({ title: 'Nueva Visita' })

const { generateQr, isGenerating, error } = useQr()
const { unitId, fetchUnit, isLoading: isLoadingUnit, error: unitError } = useConserjeUnit()
const { formatDateTime } = useFormatDate()

// Form state
const visitorName = ref('')
const visitorDocument = ref('')
const visitorType = ref<VisitorType>('invitado')
const frequentVisitorId = ref<string | null>(null)

// Date/time picker state
const expiresDate = shallowRef<DateValue>(today(getLocalTimeZone()).add({ days: 1 }))
const datePickerOpen = ref(false)

// Time picker state (3 independent selects)
const now = new Date()
const currentH = now.getHours()
const roundedMin = Math.ceil(now.getMinutes() / 5) * 5
const overflowHour = roundedMin >= 60

const expiresHour = ref(String((() => {
  let h = overflowHour ? currentH + 1 : currentH
  if (h >= 24) h = 0
  if (h === 0) return 12
  if (h > 12) return h - 12
  return h
})()))
const expiresMinute = ref(String(overflowHour ? 0 : roundedMin).padStart(2, '0'))
const expiresPeriod = ref<'AM' | 'PM'>((overflowHour ? currentH + 1 : currentH) >= 12 ? 'PM' : 'AM')

// Options
const hourOptions = Array.from({ length: 12 }, (_, i) => String(i + 1))
const minuteOptions = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

// Computed ISO string for submission
const expiresAtISO = computed(() => {
  const d = expiresDate.value
  let h = Number(expiresHour.value)
  if (expiresPeriod.value === 'AM' && h === 12) h = 0
  else if (expiresPeriod.value === 'PM' && h !== 12) h = h + 12
  return new Date(d.year, d.month - 1, d.day, h, Number(expiresMinute.value)).toISOString()
})

// Format display
function formatSelectedDate(d: DateValue): string {
  const date = new Date(d.year, d.month - 1, d.day)
  const formatted = date.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

// Pre-fill from frequent visitor query params
const route = useRoute()
onMounted(async () => {
  await fetchUnit()

  if (route.query.nombre) {
    visitorName.value = route.query.nombre as string
    visitorDocument.value = (route.query.cedula as string) || ''
    const tipo = route.query.tipo as string
    if (tipo === 'invitado' || tipo === 'proveedor') {
      visitorType.value = tipo
    }
    frequentVisitorId.value = (route.query.fid as string) || null
  }
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

const isFormValid = computed(() => {
  return visitorName.value.trim() !== ''
    && !!unitId.value
    && !!expiresDate.value
})

async function handleGenerate() {
  if (!isFormValid.value || !unitId.value) return

  shareSuccess.value = null

  try {
    const result = await generateQr({
      visitorName: visitorName.value.trim(),
      visitorDocument: visitorDocument.value.trim() || undefined,
      visitorType: visitorType.value,
      unitId: unitId.value,
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
  expiresDate.value = today(getLocalTimeZone()).add({ days: 1 })
  const resetNow = new Date()
  const resetH = resetNow.getHours()
  const resetRounded = Math.ceil(resetNow.getMinutes() / 5) * 5
  const resetOverflow = resetRounded >= 60
  let resetHour = resetOverflow ? resetH + 1 : resetH
  if (resetHour >= 24) resetHour = 0
  expiresHour.value = String(resetHour === 0 ? 12 : resetHour > 12 ? resetHour - 12 : resetHour)
  expiresMinute.value = String(resetOverflow ? 0 : resetRounded).padStart(2, '0')
  expiresPeriod.value = resetHour >= 12 ? 'PM' : 'AM'
  frequentVisitorId.value = null
  generatedToken.value = null
  generatedData.value = null
  qrDataUrl.value = null
  shareSuccess.value = null
  error.value = null
}
</script>

<template>
  <div>
    <!-- Unit loading/error -->
    <div v-if="isLoadingUnit" class="flex items-center justify-center py-12">
      <Loader2 class="size-6 animate-spin text-muted-foreground" />
    </div>

    <ErrorAlert v-else-if="unitError" :message="unitError" class="mb-4" />

    <template v-else>
      <!-- Error alert -->
      <ErrorAlert :message="error" class="mb-4" />

      <!-- Form (hidden after generation) -->
      <form v-if="!generatedToken" @submit.prevent="handleGenerate">
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

          <!-- Cedula | Tipo (row) -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label for="visitor-document">Cedula <span class="text-xs text-muted-foreground">(opcional)</span></Label>
              <Input
                id="visitor-document"
                v-model="visitorDocument"
                placeholder="V-12345678"
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

          <!-- Fecha | Hora (row) -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label>Fecha limite <span class="text-destructive">*</span></Label>
              <Popover v-model:open="datePickerOpen">
                <PopoverTrigger as-child>
                  <Button variant="outline" class="h-12 w-full justify-start rounded-lg text-base font-normal">
                    <CalendarIcon class="mr-2 size-4 shrink-0 text-muted-foreground" />
                    <span class="truncate">{{ formatSelectedDate(expiresDate) }}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar
                    :model-value="expiresDate"
                    locale="es"
                    :min-value="today(getLocalTimeZone())"
                    @update:model-value="(v: DateValue | undefined) => { if (v) { expiresDate = v; datePickerOpen = false } }"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div class="space-y-1.5">
              <Label>Hora limite <span class="text-destructive">*</span></Label>
              <div class="flex items-center gap-2">
                <Select v-model="expiresHour">
                  <SelectTrigger size="lg" class="w-full text-center text-base">
                    <SelectValue placeholder="H" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="h in hourOptions" :key="h" :value="h">{{ h }}</SelectItem>
                  </SelectContent>
                </Select>
                <span class="text-base font-medium text-muted-foreground">:</span>
                <Select v-model="expiresMinute">
                  <SelectTrigger size="lg" class="w-full text-center text-base">
                    <SelectValue placeholder="M" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="m in minuteOptions" :key="m" :value="m">{{ m }}</SelectItem>
                  </SelectContent>
                </Select>
                <Select v-model="expiresPeriod">
                  <SelectTrigger size="lg" class="w-full text-center text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <span class="text-muted-foreground">Valido hasta</span>
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
            Compartir con el visitante
          </Button>
          <Button variant="outline" class="h-12 w-full text-base" @click="handleReset">
            <Plus class="size-4" />
            Crear otro pase
          </Button>
        </div>
      </div>
    </template>
  </div>
</template>
