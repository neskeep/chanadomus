<script setup lang="ts">
import { SwitchCamera, CheckCircle2, XCircle, AlertTriangle, Camera, ScanLine, User, Home, Clock, RotateCcw, Car, HardHat, LogIn, LogOut } from 'lucide-vue-next'
import type { ValidationStatus } from '~~/shared/types/qr'
import { VALIDATION_STATUS_COLORS, VALIDATION_STATUS_LABELS, ACCESS_DIRECTION_COLORS, ACCESS_DIRECTION_LABELS } from '~/composables/useColorMap'

useHead({ title: 'Escanear QR' })

const { target, isMounted } = useTopbarPortal()
const {
  isScanning,
  scanResult,
  isProcessing,
  error,
  videoRef,
  canvasRef,
  selectedDirection,
  startScanning,
  stopScanning,
  toggleCamera,
  resetScan,
  resetToSelection,
} = useQrScanner()

function selectDirection(direction: 'entry' | 'exit') {
  selectedDirection.value = direction
  startScanning()
}

onUnmounted(() => {
  stopScanning()
})

const statusConfig: Record<ValidationStatus, { label: string; bg: string; icon: string; accent: string }> = {
  valid: { label: VALIDATION_STATUS_LABELS.valid, ...VALIDATION_STATUS_COLORS.valid },
  expired: { label: VALIDATION_STATUS_LABELS.expired, ...VALIDATION_STATUS_COLORS.expired },
  already_used: { label: VALIDATION_STATUS_LABELS.already_used, ...VALIDATION_STATUS_COLORS.already_used },
  invalid: { label: VALIDATION_STATUS_LABELS.invalid, ...VALIDATION_STATUS_COLORS.invalid },
}

/** Resolved config: uses direction-specific colors for valid scans with direction */
const resolvedConfig = computed(() => {
  if (!scanResult.value) return statusConfig.invalid
  const direction = scanResult.value.direction
  if (scanResult.value.status === 'valid' && direction) {
    return {
      label: ACCESS_DIRECTION_LABELS[direction],
      ...ACCESS_DIRECTION_COLORS[direction],
    }
  }
  return statusConfig[scanResult.value.status]
})
</script>

<template>
  <div class="-mx-4 -my-6 lg:-mx-6 flex h-[calc(100dvh-3rem-4.5rem)] md:h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-black">
    <Teleport :to="target" defer v-if="isMounted && selectedDirection">
      <Button variant="ghost" size="sm" @click="toggleCamera">
        <SwitchCamera class="mr-1 size-4" />
        Cámara
      </Button>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction v-if="selectedDirection">
      <Button variant="ghost" size="icon" class="size-9" @click="toggleCamera">
        <SwitchCamera class="size-4" />
      </Button>
    </TopbarMobileAction>

    <!-- Direction selection screen -->
    <div
      v-if="!selectedDirection"
      class="flex flex-1 flex-col items-center justify-center gap-8 bg-black px-6"
    >
      <p class="text-sm font-medium text-white/70">Selecciona el tipo de acceso</p>
      <div class="flex w-full max-w-xs flex-col gap-4">
        <Button
          class="h-24 w-full gap-3 rounded-xl bg-emerald-600 text-xl font-semibold text-white hover:bg-emerald-700"
          @click="selectDirection('entry')"
        >
          <LogIn class="size-8" />
          Entrada
        </Button>
        <Button
          class="h-24 w-full gap-3 rounded-xl bg-blue-600 text-xl font-semibold text-white hover:bg-blue-700"
          @click="selectDirection('exit')"
        >
          <LogOut class="size-8" />
          Salida
        </Button>
      </div>
    </div>

    <!-- Full viewport camera -->
    <div v-else class="relative flex-1 overflow-hidden">
      <video
        ref="videoRef"
        class="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        autoplay
        playsinline
        muted
      />
      <canvas ref="canvasRef" class="hidden" />

      <!-- Scanning viewfinder -->
      <div
        v-if="isScanning && !scanResult && !isProcessing"
        class="absolute inset-0 flex flex-col items-center justify-center"
      >
        <!-- Dimmed edges around viewfinder -->
        <div class="absolute inset-0 bg-black/40" />

        <div class="relative z-10 flex flex-col items-center gap-6">
          <!-- Viewfinder frame -->
          <div class="relative size-56 sm:size-64">
            <!-- Cut-out effect -->
            <div class="absolute -inset-[2000px] bg-black/40 [clip-path:polygon(0_0,100%_0,100%_100%,0_100%,0_0,calc(50%-7rem)_calc(50%-7rem),calc(50%-7rem)_calc(50%+7rem),calc(50%+7rem)_calc(50%+7rem),calc(50%+7rem)_calc(50%-7rem),calc(50%-7rem)_calc(50%-7rem))] sm:[clip-path:polygon(0_0,100%_0,100%_100%,0_100%,0_0,calc(50%-8rem)_calc(50%-8rem),calc(50%-8rem)_calc(50%+8rem),calc(50%+8rem)_calc(50%+8rem),calc(50%+8rem)_calc(50%-8rem),calc(50%-8rem)_calc(50%-8rem))]" />

            <!-- Corner brackets -->
            <div class="absolute left-0 top-0 h-10 w-10 border-l-[3px] border-t-[3px] border-white rounded-tl-lg" />
            <div class="absolute right-0 top-0 h-10 w-10 border-r-[3px] border-t-[3px] border-white rounded-tr-lg" />
            <div class="absolute bottom-0 left-0 h-10 w-10 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
            <div class="absolute bottom-0 right-0 h-10 w-10 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />

            <!-- Scan line animation -->
            <div class="absolute inset-x-3 top-3 h-0.5 animate-[scan_2s_ease-in-out_infinite] rounded-lg bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          </div>

          <!-- Hint text -->
          <p class="relative z-10 text-sm font-medium text-white/80">
            Apunta al código QR del visitante
          </p>
        </div>
      </div>

      <!-- Processing overlay -->
      <div
        v-if="isProcessing"
        class="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
      >
        <div class="size-14 animate-spin rounded-lg border-[3px] border-white/20 border-t-white" />
        <p class="mt-5 text-lg font-medium text-white">Validando código...</p>
      </div>

      <!-- Result overlay (replaces camera view) -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
      >
        <div
          v-if="scanResult"
          class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md px-6"
        >
          <!-- Status icon -->
          <div
            :class="[resolvedConfig.accent]"
            class="flex size-24 items-center justify-center rounded-lg bg-white/10 ring-2 backdrop-blur-sm"
          >
            <LogOut
              v-if="scanResult.status === 'valid' && scanResult.direction === 'exit'"
              :class="resolvedConfig.icon"
              class="size-12"
            />
            <LogIn
              v-else-if="scanResult.status === 'valid' && scanResult.direction === 'entry'"
              :class="resolvedConfig.icon"
              class="size-12"
            />
            <CheckCircle2
              v-else-if="scanResult.status === 'valid'"
              :class="resolvedConfig.icon"
              class="size-12"
            />
            <AlertTriangle
              v-else-if="scanResult.status === 'expired' || scanResult.status === 'already_used'"
              :class="resolvedConfig.icon"
              class="size-12"
            />
            <XCircle
              v-else
              :class="resolvedConfig.icon"
              class="size-12"
            />
          </div>

          <!-- Status label -->
          <div
            :class="resolvedConfig.bg"
            class="mt-5 rounded-lg px-5 py-1.5 text-sm font-semibold text-white"
          >
            {{ resolvedConfig.label }}
          </div>

          <!-- Visitor details (standard QR) -->
          <div
            v-if="(scanResult.visitorName || scanResult.unitNumber) && !scanResult.isVehiclePass && !scanResult.isResidentPass && !scanResult.isStaffPass"
            class="mt-6 w-full max-w-xs space-y-3 rounded-lg bg-white/10 p-4 backdrop-blur-sm"
          >
            <div v-if="scanResult.visitorName" class="flex items-center gap-3">
              <User class="size-4 shrink-0 text-white/50" />
              <span class="text-base font-medium text-white">{{ scanResult.visitorName }}</span>
            </div>
            <div v-if="scanResult.unitNumber" class="flex items-center gap-3">
              <Home class="size-4 shrink-0 text-white/50" />
              <span class="text-sm text-white/80">
                {{ scanResult.unitNumber }}{{ scanResult.unitLabel ? ` — ${scanResult.unitLabel}` : '' }}
              </span>
            </div>
            <div v-if="scanResult.visitorType" class="flex items-center gap-3">
              <Clock class="size-4 shrink-0 text-white/50" />
              <span class="text-sm text-white/80">
                {{ scanResult.visitorType === 'invitado' ? 'Invitado' : 'Proveedor' }}
              </span>
            </div>
          </div>

          <!-- Vehicle pass details -->
          <div
            v-if="scanResult.isVehiclePass"
            class="mt-6 w-full max-w-xs space-y-3 rounded-lg bg-white/10 p-4 backdrop-blur-sm"
          >
            <div class="flex items-center gap-3">
              <Car class="size-4 shrink-0 text-white/50" />
              <span class="font-mono text-base font-bold tracking-wider text-white">{{ scanResult.vehiclePlate }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm text-white/80">{{ scanResult.vehicleBrand }} {{ scanResult.vehicleModel }} · {{ scanResult.vehicleColor }}</span>
            </div>
            <div v-if="scanResult.unitNumber" class="flex items-center gap-3">
              <Home class="size-4 shrink-0 text-white/50" />
              <span class="text-sm text-white/80">
                {{ scanResult.unitNumber }}{{ scanResult.unitLabel ? ` — ${scanResult.unitLabel}` : '' }}
              </span>
            </div>
            <div class="flex items-center gap-3">
              <Badge variant="secondary" class="text-xs">
                {{ scanResult.passType === 'resident' ? 'Residente' : 'Invitado' }}
              </Badge>
              <span v-if="scanResult.occupantLimit" class="text-xs text-white/60">
                Max. {{ scanResult.occupantLimit }} ocupantes
              </span>
            </div>
          </div>

          <!-- Resident pass details -->
          <div
            v-if="scanResult.isResidentPass"
            class="mt-6 w-full max-w-xs space-y-3 rounded-lg bg-white/10 p-4 backdrop-blur-sm"
          >
            <div class="flex items-center gap-3">
              <User class="size-4 shrink-0 text-white/50" />
              <span class="text-base font-medium text-white">{{ scanResult.residentName }}</span>
            </div>
            <div v-if="scanResult.unitNumber" class="flex items-center gap-3">
              <Home class="size-4 shrink-0 text-white/50" />
              <span class="text-sm text-white/80">
                {{ scanResult.unitNumber }}{{ scanResult.unitLabel ? ` — ${scanResult.unitLabel}` : '' }}
              </span>
            </div>
            <Badge variant="secondary" class="text-xs">Pase de Residente</Badge>
          </div>

          <!-- Service staff pass details -->
          <div
            v-if="scanResult.isStaffPass"
            class="mt-6 w-full max-w-xs space-y-3 rounded-lg bg-white/10 p-4 backdrop-blur-sm"
          >
            <div class="flex items-center gap-3">
              <HardHat class="size-4 shrink-0 text-white/50" />
              <span class="text-base font-medium text-white">{{ scanResult.staffName }}</span>
            </div>
            <div v-if="scanResult.staffRole" class="flex items-center gap-3">
              <Badge variant="secondary" class="text-xs">{{ scanResult.staffRole }}</Badge>
            </div>
            <div v-if="scanResult.unitNumber" class="flex items-center gap-3">
              <Home class="size-4 shrink-0 text-white/50" />
              <span class="text-sm text-white/80">
                {{ scanResult.unitNumber }}{{ scanResult.unitLabel ? ` — ${scanResult.unitLabel}` : '' }}
              </span>
            </div>
            <Badge variant="outline" class="border-white/20 text-xs text-white/80">Personal de Servicio</Badge>
          </div>

          <!-- Scan again button -->
          <Button
            class="mt-8 h-12 gap-2 px-8 text-base"
            @click="resetToSelection"
          >
            <RotateCcw class="size-4" />
            Escanear otro
          </Button>
        </div>
      </Transition>

      <!-- Error toast overlay -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="error"
          role="alert"
          class="absolute inset-x-4 top-4 rounded-lg border border-red-500/30 bg-red-950/80 p-3 text-sm text-red-200 backdrop-blur-sm"
        >
          {{ error }}
        </div>
      </Transition>

      <!-- Start scanning prompt -->
      <button
        v-if="!isScanning && !error"
        class="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/80"
        @click="startScanning"
      >
        <div class="flex size-20 items-center justify-center rounded-lg bg-white/10 ring-2 ring-white/20">
          <Camera class="size-10 text-white/70" />
        </div>
        <p class="text-lg font-medium text-white/80">Toque para iniciar</p>
      </button>
    </div>
  </div>
</template>
