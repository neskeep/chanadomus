<script setup lang="ts">
import { ShieldAlert, Loader2 } from 'lucide-vue-next'

const HOLD_DURATION = 2000

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
  }, 16)

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
    setTimeout(() => {
      isTriggered.value = false
    }, 5000)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al enviar alerta'
    setTimeout(() => {
      error.value = null
    }, 3000)
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
    class="relative flex size-8 items-center justify-center rounded-md transition-all select-none"
    :class="[
      isTriggered
        ? 'bg-green-600 text-white'
        : isHolding
          ? 'scale-110 bg-red-600 text-white ring-2 ring-red-300'
          : 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30',
    ]"
    :disabled="isLoading"
    :title="isTriggered ? 'Alerta enviada' : 'Manten presionado para alerta de panico'"
    @pointerdown.prevent="startHold"
    @pointerup="cancelHold"
    @pointerleave="cancelHold"
    @contextmenu.prevent
  >
    <!-- Progress ring (subtle) -->
    <svg
      v-if="isHolding"
      class="absolute inset-0 -rotate-90"
      viewBox="0 0 32 32"
    >
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        stroke-width="2"
      />
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        :stroke-dasharray="87.96"
        :stroke-dashoffset="87.96 - (87.96 * holdProgress) / 100"
      />
    </svg>

    <Loader2 v-if="isLoading" class="size-4 animate-spin" />
    <ShieldAlert v-else class="size-4" />
  </button>
</template>
