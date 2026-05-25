import type { PanicAlert as WsPanicAlert } from '~~/server/utils/ws-panic'

export interface PanicAlertLog extends WsPanicAlert {
  resolvedAt: string | null
  resolvedNote: string | null
  resolverName: string | null
}

const MAX_ALERTS = 50

// Module-level shared state (singleton across all components)
const alerts = ref<PanicAlertLog[]>([])
const activeAlert = ref<WsPanicAlert | null>(null)
const isConnected = ref(false)
const _initialized = ref(false)

// Persistent alarm state
let alarmCtx: AudioContext | null = null
let alarmInterval: ReturnType<typeof setInterval> | null = null

function startAlarm() {
  if (typeof window === 'undefined') return
  stopAlarm()

  function playBeepSequence() {
    if (!alarmCtx || alarmCtx.state === 'closed') {
      alarmCtx = new AudioContext()
    }
    const ctx = alarmCtx
    const beepDuration = 0.2
    const gap = 0.05

    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = i % 2 === 0 ? 800 : 1200
      osc.type = 'square'
      const start = i * (beepDuration + gap)
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + beepDuration)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + beepDuration)
    }
  }

  playBeepSequence()
  // Repeat every 2 seconds until dismissed
  alarmInterval = setInterval(playBeepSequence, 2000)
}

function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval)
    alarmInterval = null
  }
  if (alarmCtx && alarmCtx.state !== 'closed') {
    alarmCtx.close()
    alarmCtx = null
  }
}

function initWs() {
  if (_initialized.value) return

  _initialized.value = true

  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const wsUrl = `${wsProtocol}://${window.location.host}/_ws/panic`

  const { status, data } = useWebSocket(wsUrl, {
    autoReconnect: {
      retries: -1,
      delay: 3000,
    },
    heartbeat: {
      message: 'ping',
      interval: 30000,
      pongTimeout: 10000,
    },
    immediate: true,
  })

  watch(status, (newStatus) => {
    isConnected.value = newStatus === 'OPEN'
  })

  watch(data, (raw) => {
    if (!raw) return

    try {
      const message = JSON.parse(raw as string) as { type: string; data: WsPanicAlert & { id: string } }
      if (message.type === 'panic-alert' && message.data) {
        const logEntry: PanicAlertLog = {
          ...message.data,
          resolvedAt: null,
          resolvedNote: null,
          resolverName: null,
        }
        alerts.value = [logEntry, ...alerts.value].slice(0, MAX_ALERTS)
        activeAlert.value = message.data
        startAlarm()
      }
      else if (message.type === 'panic-dismiss' && message.data?.id) {
        const dismissedId = message.data.id
        const idx = alerts.value.findIndex(a => a.id === dismissedId)
        if (idx !== -1) {
          const existing = alerts.value[idx]
          if (existing) {
            alerts.value[idx] = {
              ...existing,
              resolvedAt: new Date().toISOString(),
              resolvedNote: 'Desactivada por el usuario',
              resolverName: null,
            }
          }
        }
        if (activeAlert.value?.id === dismissedId) {
          activeAlert.value = null
          stopAlarm()
        }
      }
    }
    catch {
      // Ignore non-JSON messages (e.g. 'pong')
    }
  })
}

export function usePanicStream() {
  if (!_initialized.value && !import.meta.server) {
    const { role } = useAuth()

    // If role is already available, init immediately
    if (role.value === 'vigilancia' || role.value === 'admin') {
      initWs()
    }
    else {
      // Role not yet loaded (hard refresh) — watch until it resolves
      const stopWatch = watch(role, (newRole) => {
        if (newRole === 'vigilancia' || newRole === 'admin') {
          initWs()
          stopWatch()
        }
      })
    }
  }

  const hasActiveAlert = computed(() => activeAlert.value !== null)

  function dismissAlert() {
    activeAlert.value = null
    stopAlarm()
  }

  async function resolveAlert(id: string, note?: string) {
    await $fetch(`/api/panic/${id}/resolve`, {
      method: 'PATCH',
      body: { note },
    })
    // Update local state
    const idx = alerts.value.findIndex(a => a.id === id)
    if (idx !== -1) {
      const existing = alerts.value[idx]
      if (existing) {
        alerts.value[idx] = {
          ...existing,
          resolvedAt: new Date().toISOString(),
          resolverName: null,
          resolvedNote: note ?? null,
        }
      }
    }
    // Clear active alert if it was the resolved one
    if (activeAlert.value?.id === id) {
      dismissAlert()
    }
  }

  async function loadInitialAlerts() {
    try {
      const result = await $fetch<{ data: PanicAlertLog[] }>('/api/panic')
      alerts.value = result.data
    }
    catch (err: unknown) {
      console.error('Failed to load initial panic alerts:', err)
    }
  }

  return {
    alerts: readonly(alerts),
    activeAlert: readonly(activeAlert),
    isConnected: readonly(isConnected),
    hasActiveAlert,
    dismissAlert,
    resolveAlert,
    loadInitialAlerts,
  }
}
