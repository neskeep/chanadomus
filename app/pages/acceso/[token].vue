<script setup lang="ts">
import { CheckCircle, Clock, Info, XCircle, Loader2 } from 'lucide-vue-next'
import QRCode from 'qrcode'

definePageMeta({ layout: false })

interface LookupResult {
  status: 'valid' | 'expired' | 'already_used' | 'invalid'
  visitorName?: string
  visitorType?: 'invitado' | 'proveedor'
  unitNumber?: string
  unitLabel?: string | null
  expiresAt?: string
  usedAt?: string | null
}

const route = useRoute()
const token = route.params.token as string

const loading = ref(true)
const result = ref<LookupResult | null>(null)
const qrDataUrl = ref<string | null>(null)

const { formatDateTime } = useFormatDate()

const visitorTypeLabel = computed(() => {
  if (!result.value?.visitorType) return ''
  return result.value.visitorType === 'invitado' ? 'Invitado' : 'Proveedor'
})

onMounted(async () => {
  try {
    const response = await $fetch<{ data: LookupResult }>('/api/qr/lookup', {
      method: 'POST',
      body: { token },
    })
    result.value = response.data

    // Generate QR image for valid codes
    if (response.data.status === 'valid') {
      const accessUrl = `${window.location.origin}/acceso/${token}`
      qrDataUrl.value = await QRCode.toDataURL(accessUrl, { width: 280, margin: 2 })
    }
  }
  catch {
    result.value = { status: 'invalid' }
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-background p-4">
    <!-- Header -->
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-bold tracking-tight text-foreground">
        ChanaDomus
      </h1>
      <p class="text-sm text-muted-foreground">
        Pase de acceso
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center gap-3">
      <Loader2 class="size-10 animate-spin text-muted-foreground" />
      <p class="text-sm text-muted-foreground">Cargando pase...</p>
    </div>

    <!-- Valid: show QR pass -->
    <template v-else-if="result?.status === 'valid'">
      <Card class="w-full max-w-sm border-2 border-primary/30">
        <CardContent class="flex flex-col items-center gap-4 p-6">
          <!-- QR Code -->
          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            alt="Código QR de acceso"
            class="size-56 rounded-lg"
          />

          <!-- Visitor info -->
          <div class="w-full space-y-2 text-center">
            <p class="text-lg font-semibold">{{ result.visitorName }}</p>
            <div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{{ visitorTypeLabel }}</Badge>
              <span>→</span>
              <span class="font-medium text-foreground">
                {{ result.unitNumber }}
                <span v-if="result.unitLabel" class="text-muted-foreground">({{ result.unitLabel }})</span>
              </span>
            </div>
          </div>

          <Separator />

          <!-- Validity -->
          <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle class="size-4 text-primary" />
            <span>Válido hasta {{ result.expiresAt ? formatDateTime(result.expiresAt) : '-' }}</span>
          </div>
        </CardContent>

        <CardFooter class="justify-center border-t bg-muted/30 py-3">
          <p class="text-center text-sm text-muted-foreground">
            Presente esta pantalla al vigilante en la alcabala
          </p>
        </CardFooter>
      </Card>
    </template>

    <!-- Expired -->
    <Card v-else-if="result?.status === 'expired'" class="w-full max-w-sm border-2 border-yellow-500/30">
      <CardContent class="flex flex-col items-center gap-3 p-6 text-center">
        <Clock class="size-12 text-yellow-500" :stroke-width="1.5" />
        <p class="text-lg font-semibold">Pase expirado</p>
        <p v-if="result.visitorName" class="text-sm text-muted-foreground">
          {{ result.visitorName }}
        </p>
        <p class="text-sm text-muted-foreground">
          Solicite un nuevo pase al propietario.
        </p>
      </CardContent>
    </Card>

    <!-- Already used -->
    <Card v-else-if="result?.status === 'already_used'" class="w-full max-w-sm border-2 border-blue-500/30">
      <CardContent class="flex flex-col items-center gap-3 p-6 text-center">
        <Info class="size-12 text-blue-500" :stroke-width="1.5" />
        <p class="text-lg font-semibold">Pase ya utilizado</p>
        <p v-if="result.visitorName" class="text-sm text-muted-foreground">
          {{ result.visitorName }}
        </p>
        <p v-if="result.usedAt" class="text-sm text-muted-foreground">
          Usado el {{ formatDateTime(result.usedAt) }}
        </p>
      </CardContent>
    </Card>

    <!-- Invalid -->
    <Card v-else class="w-full max-w-sm border-2 border-destructive/30">
      <CardContent class="flex flex-col items-center gap-3 p-6 text-center">
        <XCircle class="size-12 text-destructive" :stroke-width="1.5" />
        <p class="text-lg font-semibold">Pase inválido</p>
        <p class="text-sm text-muted-foreground">
          Este código no existe o no es válido.
        </p>
      </CardContent>
    </Card>

    <!-- Page footer -->
    <p class="mt-8 text-xs text-muted-foreground">
      Ranchos de Chana
    </p>
  </div>
</template>
