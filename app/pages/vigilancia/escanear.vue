<script setup lang="ts">
import { SwitchCamera, CheckCircle2, XCircle, AlertTriangle, Camera } from 'lucide-vue-next'
import type { ValidationStatus } from '~~/shared/types/qr'

useHead({ title: 'Escanear QR' })

const {
  isScanning,
  scanResult,
  isProcessing,
  error,
  videoRef,
  canvasRef,
  facingMode,
  startScanning,
  stopScanning,
  toggleCamera,
  resetScan,
} = useQrScanner()

onMounted(() => {
  startScanning()
})

onUnmounted(() => {
  stopScanning()
})

function statusLabel(status: ValidationStatus): string {
  const map: Record<ValidationStatus, string> = {
    valid: 'Acceso autorizado',
    expired: 'Código expirado',
    already_used: 'Código ya utilizado',
    invalid: 'Código inválido',
  }
  return map[status]
}

function resultBorderClass(status: ValidationStatus): string {
  const map: Record<ValidationStatus, string> = {
    valid: 'border-l-green-500',
    expired: 'border-l-amber-500',
    already_used: 'border-l-amber-500',
    invalid: 'border-l-red-500',
  }
  return map[status]
}

function resultIconBgClass(status: ValidationStatus): string {
  const map: Record<ValidationStatus, string> = {
    valid: 'bg-green-100 text-green-600',
    expired: 'bg-amber-100 text-amber-600',
    already_used: 'bg-amber-100 text-amber-600',
    invalid: 'bg-red-100 text-red-600',
  }
  return map[status]
}
</script>

<template>
  <div class="-mx-4 -my-6 flex min-h-[calc(100dvh-3.5rem-4rem)] flex-col bg-background">
    <!-- Header -->
    <div class="flex items-center justify-end border-b px-4 py-3">
      <Button variant="ghost" size="icon" class="size-9" @click="toggleCamera">
        <SwitchCamera class="size-5" />
        <span class="sr-only">Cambiar cámara</span>
      </Button>
    </div>

    <!-- Error message -->
    <div
      v-if="error"
      role="alert"
      class="mx-4 mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Camera area -->
    <div class="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
      <video
        ref="videoRef"
        class="h-full w-full object-cover"
        autoplay
        playsinline
        muted
      />
      <canvas ref="canvasRef" class="hidden" />

      <!-- Scanning overlay with corner accents -->
      <div
        v-if="isScanning && !scanResult && !isProcessing"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="relative size-64">
          <!-- Top-left corner -->
          <div class="absolute left-0 top-0 h-8 w-8 border-l-3 border-t-3 border-white rounded-tl-lg" />
          <!-- Top-right corner -->
          <div class="absolute right-0 top-0 h-8 w-8 border-r-3 border-t-3 border-white rounded-tr-lg" />
          <!-- Bottom-left corner -->
          <div class="absolute bottom-0 left-0 h-8 w-8 border-b-3 border-l-3 border-white rounded-bl-lg" />
          <!-- Bottom-right corner -->
          <div class="absolute bottom-0 right-0 h-8 w-8 border-b-3 border-r-3 border-white rounded-br-lg" />
        </div>
      </div>

      <!-- Processing indicator -->
      <div
        v-if="isProcessing"
        class="absolute inset-0 flex flex-col items-center justify-center bg-black/60"
      >
        <div class="size-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        <p class="mt-4 text-lg font-medium text-white">Validando...</p>
      </div>

      <!-- Start scanning prompt -->
      <button
        v-if="!isScanning && !error"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80"
        @click="startScanning"
      >
        <Camera class="size-16 text-white/70" />
        <p class="text-lg text-white">Toque para iniciar la cámara</p>
      </button>
    </div>

    <!-- Result card -->
    <div v-if="scanResult" class="p-4">
      <Card :class="resultBorderClass(scanResult.status)" class="border-l-4">
        <CardContent class="p-4">
          <div class="flex items-center gap-3">
            <div :class="resultIconBgClass(scanResult.status)" class="rounded-full p-2.5">
              <CheckCircle2 v-if="scanResult.status === 'valid'" class="size-6" />
              <AlertTriangle v-if="scanResult.status === 'expired' || scanResult.status === 'already_used'" class="size-6" />
              <XCircle v-if="scanResult.status === 'invalid'" class="size-6" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-lg font-semibold">{{ statusLabel(scanResult.status) }}</p>
              <p v-if="scanResult.visitorName" class="text-sm text-muted-foreground">
                {{ scanResult.visitorName }}
              </p>
              <p v-if="scanResult.unitNumber" class="text-xs text-muted-foreground">
                → {{ scanResult.unitNumber }}{{ scanResult.unitLabel ? ` — ${scanResult.unitLabel}` : '' }}
              </p>
            </div>
          </div>
          <Button class="mt-3 w-full" @click="resetScan">
            Escanear otro
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
