<script setup lang="ts">
import { AlertTriangle, Loader2 } from 'lucide-vue-next'

const HOLD_DURATION = 2000 // 2 segundos de press & hold

const isHolding = ref(false)
const isTriggered = ref(false)
const isLoading = ref(false)
const holdProgress = ref(0)
const error = ref<string | null>(null)

let holdTimer: ReturnType<typeof setTimeout> | null = null
let progressInterval: ReturnType<typeof setInterval> | null = null

function startHold() {
  if (isLoading.value || isTriggered.value) return

  isHolding.value = true
  holdProgress.value = 0
  error.value = null

  const startTime = Date.now()

  progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime
    holdProgress.value = Math.min((elapsed / HOLD_DURATION) * 100, 100)
  }, 16) // ~60fps

  holdTimer = setTimeout(() => {
    triggerPanic()
  }, HOLD_DURATION)
}

function cancelHold() {
  isHolding.value = false
  holdProgress.value = 0

  if (holdTimer) {
    clearTimeout(holdTimer)
    holdTimer = null
  }
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

async function triggerPanic() {
  cancelHold()
  isLoading.value = true

  try {
    await $fetch('/api/panic', { method: 'POST' })
    isTriggered.value = true

    // Reset despues de 5 segundos
    setTimeout(() => {
      isTriggered.value = false
    }, 5000)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al enviar alerta'
  } finally {
    isLoading.value = false
  }
}

onUnmounted(() => {
  cancelHold()
})
</script>

<template>
  <button
    class="group relative flex size-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 select-none"
    :class="[
      isTriggered
        ? 'bg-green-600 text-white'
        : isHolding
          ? 'scale-110 bg-red-700 text-white ring-4 ring-red-300'
          : 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
    ]"
    :disabled="isLoading"
    @pointerdown.prevent="startHold"
    @pointerup="cancelHold"
    @pointerleave="cancelHold"
    @contextmenu.prevent
  >
    <!-- Progress ring -->
    <svg
      v-if="isHolding"
      class="absolute inset-0 -rotate-90"
      viewBox="0 0 56 56"
    >
      <circle
        cx="28"
        cy="28"
        r="26"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        stroke-width="3"
      />
      <circle
        cx="28"
        cy="28"
        r="26"
        fill="none"
        stroke="white"
        stroke-width="3"
        stroke-linecap="round"
        :stroke-dasharray="163.36"
        :stroke-dashoffset="163.36 - (163.36 * holdProgress) / 100"
        class="transition-[stroke-dashoffset] duration-75"
      />
    </svg>

    <!-- Icon -->
    <Loader2 v-if="isLoading" class="size-6 animate-spin" />
    <AlertTriangle v-else class="size-6" />
  </button>

  <!-- Status text -->
  <Transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <p
      v-if="isHolding"
      class="mt-1 text-center text-[10px] font-medium text-red-600"
    >
      Mantén presionado...
    </p>
    <p
      v-else-if="isTriggered"
      class="mt-1 text-center text-[10px] font-medium text-green-600"
    >
      Alerta enviada
    </p>
    <p
      v-else-if="error"
      class="mt-1 text-center text-[10px] font-medium text-destructive"
    >
      {{ error }}
    </p>
  </Transition>
</template>
