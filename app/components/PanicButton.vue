<script setup lang="ts">
import { ShieldAlert, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { cva } from 'class-variance-authority'

const HOLD_DURATION = 2000
const HOLD_SECONDS = HOLD_DURATION / 1000

const HINT_ACTIVATE = `Para enviar la alerta, mantén presionado el botón Pánico durante ${HOLD_SECONDS} segundos.`
const HINT_DEACTIVATE = `Para desactivar la alerta, mantén presionado el botón durante ${HOLD_SECONDS} segundos.`

const isHolding = ref(false)
const activeAlertId = ref<string | null>(null)
const hasActiveAlert = computed(() => activeAlertId.value !== null)
const isLoading = ref(false)
const holdProgress = ref(0)

// Estados visuales del botón: reposo, mantenido en curso y alerta activa.
const panicButtonVariants = cva(
  'relative h-11 gap-2 px-4 text-sm font-semibold select-none touch-none transition-transform',
  {
    variants: {
      state: {
        idle: 'bg-emergency text-emergency-foreground hover:bg-emergency/90 focus-visible:ring-emergency/40',
        holding: 'scale-105 bg-emergency text-emergency-foreground ring-4 ring-emergency/40 hover:bg-emergency motion-reduce:scale-100',
        active: 'border-2 border-emergency bg-background text-emergency hover:bg-emergency/10 focus-visible:ring-emergency/40',
      },
    },
    defaultVariants: { state: 'idle' },
  },
)

const buttonState = computed<'idle' | 'holding' | 'active'>(() => {
  if (isHolding.value) return 'holding'
  if (hasActiveAlert.value) return 'active'
  return 'idle'
})

const ariaLabel = computed(() => hasActiveAlert.value
  ? `Pánico: alerta activa, vigilancia notificada. Mantén presionado ${HOLD_SECONDS} segundos para desactivarla`
  : `Pánico: mantén presionado ${HOLD_SECONDS} segundos para enviar una alerta a vigilancia`)

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
  if (isLoading.value || isHolding.value) return

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

/**
 * El usuario soltó antes de completar el mantenido: se cancela y se explica cómo
 * activarlo (un toque breve no hace nada y, sin esta ayuda, no hay forma de saberlo en táctil).
 */
function releaseHold() {
  if (!isHolding.value) return
  cancelHold()
  toast.info(hasActiveAlert.value ? HINT_DEACTIVATE : HINT_ACTIVATE, { id: 'panic-hint' })
}

// Teclado: mantener Enter o Espacio equivale a mantener presionado.
function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  if (event.repeat) return
  startHold()
}

function onKeyup(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  releaseHold()
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
      toast.warning('Alerta registrada. Ahora mismo no hay vigilancia conectada.')
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
  <Button
    :class="panicButtonVariants({ state: buttonState })"
    :disabled="isLoading"
    :aria-label="ariaLabel"
    @pointerdown.prevent="startHold"
    @pointerup="releaseHold"
    @pointerleave="releaseHold"
    @pointercancel="cancelHold"
    @keydown="onKeydown"
    @keyup="onKeyup"
    @blur="cancelHold"
    @contextmenu.prevent
  >
    <!-- Indicador de alerta activa -->
    <span
      v-if="hasActiveAlert && !isHolding"
      aria-hidden="true"
      class="absolute -top-1 -right-1 flex size-3"
    >
      <span class="absolute inline-flex size-full animate-ping rounded-lg bg-emergency/70 motion-reduce:animate-none" />
      <span class="relative inline-flex size-3 rounded-lg bg-emergency ring-2 ring-background" />
    </span>

    <Loader2 v-if="isLoading" class="size-5 animate-spin" aria-hidden="true" />
    <ShieldAlert v-else class="size-5" aria-hidden="true" />
    <span>Pánico</span>
  </Button>

  <!-- Instrucción y progreso del mantenido. Fuera del header (backdrop-blur crea un bloque contenedor
       para position:fixed) y sin eventos de puntero para no interrumpir el gesto. -->
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-4 top-1/3 z-[100] mx-auto max-w-sm"
      aria-live="assertive"
    >
      <div
        v-if="isHolding"
        class="rounded-lg border-2 border-emergency bg-card p-5 text-center shadow-lg"
      >
        <ShieldAlert class="mx-auto mb-2 size-8 text-emergency" aria-hidden="true" />
        <p class="text-base font-semibold text-foreground">
          {{ hasActiveAlert ? 'Desactivando la alerta' : 'Enviando alerta a vigilancia' }}
        </p>
        <p class="mt-1 text-sm text-muted-foreground">
          Mantén presionado {{ HOLD_SECONDS }} segundos. Suelta para cancelar.
        </p>
        <Progress
          :model-value="holdProgress"
          aria-label="Progreso del mantenido"
          class="mt-4 h-3 [&>[data-slot=progress-indicator]]:bg-emergency"
        />
      </div>
    </div>
  </Teleport>
</template>
