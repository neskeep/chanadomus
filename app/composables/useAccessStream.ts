import type { AccessEvent } from '~~/shared/types/access'

export function useAccessStream() {
  const events = ref<AccessEvent[]>([])
  const isConnected = ref(false)
  const maxEvents = 20

  const wsProtocol = computed(() => {
    if (import.meta.server) return 'ws'
    return window.location.protocol === 'https:' ? 'wss' : 'ws'
  })

  const wsUrl = computed(() => {
    if (import.meta.server) return ''
    return `${wsProtocol.value}://${window.location.host}/_ws/access`
  })

  const { status, data, send } = useWebSocket(wsUrl, {
    autoReconnect: {
      retries: -1,
      delay: 3000,
    },
    heartbeat: {
      message: 'ping',
      interval: 30000,
      pongTimeout: 10000,
    },
    immediate: false,
  })

  watch(status, (newStatus) => {
    isConnected.value = newStatus === 'OPEN'
  })

  watch(data, (raw) => {
    if (!raw) return

    try {
      const message = JSON.parse(raw as string) as { type: string, data: AccessEvent }
      if (message.type === 'access-event' && message.data) {
        events.value = [message.data, ...events.value].slice(0, maxEvents)
      }
      if (message.type === 'access-exit' && message.data) {
        const idx = events.value.findIndex(e => e.id === message.data.id)
        const existing = events.value[idx]
        if (idx !== -1 && existing) {
          events.value[idx] = { ...existing, exitAt: message.data.exitAt }
        }
      }
    }
    catch {
      // Ignore non-JSON messages (e.g. 'pong')
    }
  })

  async function loadInitialEvents() {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const result = await $fetch('/api/access/logs', {
        query: { date: today, limit: maxEvents },
      })
      events.value = result.data
    }
    catch (err: unknown) {
      console.error('Failed to load initial access events:', err)
    }
  }

  async function markExit(id: string) {
    const result = await $fetch<{ data: { id: string; exitAt: string } }>(`/api/access/logs/${id}/exit`, { method: 'PATCH' })
    const idx = events.value.findIndex(e => e.id === id)
    const existing = events.value[idx]
    if (idx !== -1 && existing) {
      events.value[idx] = { ...existing, exitAt: result.data.exitAt }
    }
    return result.data
  }

  return {
    events,
    isConnected,
    loadInitialEvents,
    markExit,
  }
}
