<script setup lang="ts">
import { CheckCircle, Clock, Info, XCircle, Loader2 } from 'lucide-vue-next'
import QRCode from 'qrcode'
import type { ValidationResult } from '~~/shared/types/qr'

definePageMeta({ layout: false })

const route = useRoute()
const token = route.params.token as string

const loading = ref(true)
const result = ref<ValidationResult | null>(null)
const qrDataUrl = ref<string | null>(null)

const { formatDateTime } = useFormatDate()

const relationshipLabels: Record<string, string> = {
  owner: 'Propietario',
  spouse: 'Cónyuge',
  child: 'Hijo/a',
  tenant: 'Inquilino',
  other: 'Familiar',
}

const vehiclePassTypeLabels: Record<string, string> = {
  resident: 'Residente',
  guest: 'Visitante',
  temporary: 'Temporal',
}

const displayName = computed(() => {
  const r = result.value
  if (!r) return ''
  if (r.isCondoStaff) return r.staffName || ''
  if (r.isStaffPass) return r.staffName || ''
  if (r.isVehiclePass) return r.vehiclePlate || ''
  if (r.isResidentPass) return r.residentName || ''
  if (r.isMemberPass) return r.memberName || ''
  return r.visitorName || ''
})

const badgeLabel = computed(() => {
  const r = result.value
  if (!r) return ''
  if (r.isCondoStaff) return r.staffRole || 'Personal'
  if (r.isStaffPass) return r.staffRole || 'Personal'
  if (r.isVehiclePass) return r.passType ? (vehiclePassTypeLabels[r.passType] || r.passType) : 'Vehículo'
  if (r.isResidentPass) return 'Residente'
  if (r.isMemberPass) return r.memberRelationship ? (relationshipLabels[r.memberRelationship] || r.memberRelationship) : 'Familiar'
  if (r.visitorType) return r.visitorType === 'invitado' ? 'Invitado' : 'Proveedor'
  return ''
})

const showUnit = computed(() => {
  const r = result.value
  if (!r) return false
  // Condo staff does not need unit display
  if (r.isCondoStaff) return false
  return !!(r.unitLabel || r.unitNumber)
})

const unitDisplay = computed(() => {
  const r = result.value
  if (!r) return ''
  return r.unitLabel || r.unitNumber || ''
})

const vehicleDetail = computed(() => {
  const r = result.value
  if (!r?.isVehiclePass) return ''
  const parts = [r.vehicleBrand, r.vehicleModel].filter(Boolean).join(' ')
  if (parts && r.vehicleColor) return `${parts} \u00B7 ${r.vehicleColor}`
  if (parts) return parts
  if (r.vehicleColor) return r.vehicleColor
  return ''
})

const validityText = computed(() => {
  const r = result.value
  if (!r) return ''
  if (!r.expiresAt) return 'Sin vencimiento'
  return `Válido hasta ${formatDateTime(r.expiresAt)}`
})

onMounted(async () => {
  try {
    const response = await $fetch<{ data: ValidationResult }>('/api/qr/lookup', {
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

          <!-- Pass info -->
          <div class="w-full space-y-2 text-center">
            <p class="text-lg font-semibold">{{ displayName }}</p>

            <div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Badge v-if="badgeLabel" variant="secondary">{{ badgeLabel }}</Badge>
              <template v-if="showUnit">
                <span>&#8594;</span>
                <span class="font-medium text-foreground">
                  {{ unitDisplay }}
                </span>
              </template>
            </div>

            <!-- Vehicle details -->
            <p v-if="result.isVehiclePass && vehicleDetail" class="text-sm text-muted-foreground">
              {{ vehicleDetail }}
            </p>
          </div>

          <Separator />

          <!-- Validity -->
          <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle class="size-4 text-primary" />
            <span>{{ validityText }}</span>
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
        <p v-if="displayName" class="text-sm text-muted-foreground">
          {{ displayName }}
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
        <p v-if="displayName" class="text-sm text-muted-foreground">
          {{ displayName }}
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
