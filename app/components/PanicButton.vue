<script setup lang="ts">
import { ShieldAlert, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const HOLD_DURATION = 2000

const isHolding = ref(false)
const activeAlertId = ref<string | null>(null)
const hasActiveAlert = computed(() => activeAlertId.value !== null)
const isLoading = ref(false)
const holdProgress = ref(0)

let holdTimer: ReturnType<typeof setTimeout> | null = null
let progressInterval: ReturnType<typeof setInterval> | null = null

// Listen for dismiss from vigilancia via WebSocket — only connect when alert is active
let wsClose: (() => void) | null = null

function connectDismissListener() {
  if (import.meta.server || wsClose) return

  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const wsUrl = `${wsProtocol}://${window.location.host}/_ws/panic`

  const { data: wsData, close } = useWebSocket(wsUrl, {
    autoReconnect: { retries: 5, delay: 5000 },
    heartbeat: { message: 'ping', interval: 30000, pongTimeout: 10000 },
    immediate: true,
  })
  wsClose = close

  watch(wsData, (raw) => {
    if (!raw) return
    try {
      const msg = JSON.parse(raw as string) as { type: string; data: { id: string } }
      if (msg.type === 'panic-dismiss' && msg.data?.id === activeAlertId.value) {
        activeAlertId.value = null
        disconnectDismissListener()
        toast.info('Tu alerta fue atendida por vigilancia')
      }
    } catch {
      // Ignore non-JSON (pong)
    }
  })
}

function disconnectDismissListener() {
  if (wsClose) {
    wsClose()
    wsClose = null
  }
}

// Connect/disconnect WS based on active alert state
watch(hasActiveAlert, (active) => {
  if (active) {
    connectDismissListener()
  } else {
    disconnectDismissListener()
  }
})

// Check if user has an active (unresolved) panic alert on mount
onMounted(async () => {
  try {
    const res = await $fetch<{ data: { id: string; createdAt: string } | null }>('/api/panic/my-active')
    if (res.data) {
      activeAlertId.value = res.data.id
    }
  } catch {
    // Silently ignore — button works normally if check fails
  }
})

function startHold() {
  if (isLoading.value) return

  isHolding.value = true
  holdProgress.value = 0

  const startTime = Date.now()

  progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime
    holdProgress.value = Math.min((elapsed / HOLD_DURATION) * 100, 100)
  }, 16)

  holdTimer = setTimeout(() => {
    if (hasActiveAlert.value) {
      deactivatePanic()
    } else {
      triggerPanic()
    }
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
    activeAlertId.value = res.data.id

    if (res.data.pushSent > 0) {
      toast.success(`Alerta enviada a ${res.data.pushSent} vigilante${res.data.pushSent !== 1 ? 's' : ''}`)
    } else {
      toast.warning('Alerta registrada — no hay vigilancia conectada')
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error al enviar alerta'
    toast.error(msg)
  } finally {
    isLoading.value = false
  }
}

async function deactivatePanic() {
  cancelHold()
  isLoading.value = true

  try {
    await $fetch('/api/panic/my-active', { method: 'DELETE' })
    activeAlertId.value = null
    toast.success('Alerta desactivada')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error al desactivar alerta'
    toast.error(msg)
  } finally {
    isLoading.value = false
  }
}

onUnmounted(() => {
  cancelHold()
  disconnectDismissListener()
})
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="relative size-9 select-none"
          :class="[
            isHolding
              ? 'scale-110 bg-destructive text-destructive-foreground ring-2 ring-destructive/30 hover:bg-destructive/90'
              : 'text-destructive hover:bg-destructive/10',
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

          <!-- Red pulse dot when alert is active -->
          <span
            v-if="hasActiveAlert && !isHolding"
            class="absolute -top-0.5 -right-0.5 flex size-2.5"
          >
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-destructive/70" />
            <span class="relative inline-flex size-2.5 rounded-full bg-destructive" />
          </span>

          <Loader2 v-if="isLoading" class="size-4 animate-spin" />
          <ShieldAlert v-else class="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p v-if="hasActiveAlert">Alerta activa — vigilancia notificada</p>
        <p v-else>Manten presionado para alerta de panico</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
