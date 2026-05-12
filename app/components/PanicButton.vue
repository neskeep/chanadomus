<script setup lang="ts">
import { ShieldAlert, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const HOLD_DURATION = 2000

const isHolding = ref(false)
const isTriggered = ref(false)
const isLoading = ref(false)
const holdProgress = ref(0)

let holdTimer: ReturnType<typeof setTimeout> | null = null
let progressInterval: ReturnType<typeof setInterval> | null = null

function startHold() {
  if (isLoading.value || isTriggered.value) return

  isHolding.value = true
  holdProgress.value = 0

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
    const res = await $fetch<{ data: { id: string; createdAt: string; pushSent: number } }>('/api/panic', { method: 'POST' })
    isTriggered.value = true

    if (res.data.pushSent > 0) {
      toast.success(`Alerta enviada a ${res.data.pushSent} vigilante${res.data.pushSent !== 1 ? 's' : ''}`)
    } else {
      toast.warning('Alerta registrada — no hay vigilancia conectada')
    }

    setTimeout(() => {
      isTriggered.value = false
    }, 2000)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error al enviar alerta'
    toast.error(msg)
  } finally {
    isLoading.value = false
  }
}

onUnmounted(() => {
  cancelHold()
})
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    class="relative size-9 select-none"
    :class="[
      isTriggered
        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
        : isHolding
          ? 'scale-110 bg-destructive text-destructive-foreground ring-2 ring-destructive/30 hover:bg-destructive/90'
          : 'text-destructive hover:bg-destructive/10',
    ]"
    :disabled="isLoading"
    :title="isTriggered ? 'Alerta enviada' : 'Manten presionado para alerta de panico'"
    @pointerdown.prevent="startHold"
    @pointerup="cancelHold"
    @pointerleave="cancelHold"
    @contextmenu.prevent
  >
    <!-- Progress ring -->
    <svg
      v-if="isHolding"
      class="absolute inset-0 -rotate-90"
      viewBox="0 0 36 36"
    >
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        opacity="0.3"
      />
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        :stroke-dasharray="94.25"
        :stroke-dashoffset="94.25 - (94.25 * holdProgress) / 100"
      />
    </svg>

    <Loader2 v-if="isLoading" class="size-4 animate-spin" />
    <ShieldAlert v-else class="size-4" />
  </Button>
</template>
