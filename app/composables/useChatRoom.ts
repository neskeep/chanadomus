import type { Ref } from 'vue'
import type { ChatMessage } from '~~/shared/types/chat'

interface WebSocketMessage {
  type: 'message' | 'error'
  data?: ChatMessage
  message?: string
}

export function useChatRoom(roomId: Ref<string> | string) {
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const connected = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)

  let ws: WebSocket | null = null
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  let pingInterval: ReturnType<typeof setInterval> | null = null

  const MAX_RECONNECT_DELAY = 5000
  const PING_INTERVAL = 30000

  // --- History ---

  async function fetchHistory(before?: string) {
    const rid = unref(roomId)
    if (!rid) return 0

    isLoading.value = true
    error.value = null
    try {
      const url = before
        ? `/api/chat/${rid}/messages?before=${before}`
        : `/api/chat/${rid}/messages`

      const res = await $fetch<{ data: ChatMessage[] }>(url)
      const fetched = [...res.data].reverse()

      if (before) {
        messages.value = [...fetched, ...messages.value]
      }
      else {
        messages.value = fetched
      }

      if (fetched.length === 0) {
        hasMore.value = false
      }

      return fetched.length
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar mensajes'
      error.value = message
      return 0
    }
    finally {
      isLoading.value = false
    }
  }

  async function loadOlderMessages() {
    if (!hasMore.value || isLoading.value || messages.value.length === 0) return 0
    const oldestMessage = messages.value[0]
    if (!oldestMessage) return 0
    return fetchHistory(oldestMessage.id)
  }

  // --- WebSocket ---

  function connect() {
    if (import.meta.server) return

    const rid = unref(roomId)
    if (!rid) {
      error.value = 'No se especificó sala'
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/_ws/chat?roomId=${rid}`

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      connected.value = true
      error.value = null
    }

    ws.onmessage = (event: MessageEvent) => {
      const rawData = event.data as string
      if (rawData === 'pong') return

      try {
        const parsed: WebSocketMessage = JSON.parse(rawData)

        if (parsed.type === 'message' && parsed.data) {
          messages.value.push(parsed.data)
        }
        else if (parsed.type === 'error' && parsed.message) {
          error.value = parsed.message
        }
      }
      catch {
        // Non-JSON messages are ignored
      }
    }

    ws.onclose = () => {
      connected.value = false
      scheduleReconnect()
    }

    ws.onerror = () => {
      error.value = 'Error de conexión'
    }
  }

  function disconnect() {
    clearReconnect()
    if (ws) {
      ws.onclose = null // Prevent reconnect on intentional close
      ws.close()
      ws = null
    }
    connected.value = false
  }

  function scheduleReconnect() {
    clearReconnect()
    reconnectTimeout = setTimeout(() => {
      if (!connected.value) {
        connect()
      }
    }, MAX_RECONNECT_DELAY)
  }

  function clearReconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
  }

  // --- Send ---

  function sendMessage(content: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      error.value = 'No conectado'
      return false
    }

    const trimmed = content.trim()
    if (!trimmed) return false

    ws.send(JSON.stringify({ type: 'message', content: trimmed }))
    return true
  }

  // --- Keepalive ---

  function startPing() {
    stopPing()
    pingInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, PING_INTERVAL)
  }

  function stopPing() {
    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = null
    }
  }

  // --- Lifecycle ---

  function openRoom() {
    messages.value = []
    hasMore.value = true
    error.value = null
    fetchHistory()
    connect()
    startPing()
  }

  function closeRoom() {
    disconnect()
    stopPing()
    messages.value = []
    hasMore.value = true
  }

  watch(() => unref(roomId), (newId, oldId) => {
    if (newId !== oldId) {
      closeRoom()
      if (newId) {
        openRoom()
      }
    }
  })

  onUnmounted(() => {
    closeRoom()
  })

  return {
    messages,
    isLoading,
    connected,
    error,
    hasMore,
    fetchHistory,
    loadOlderMessages,
    connect,
    disconnect,
    sendMessage,
    startPing,
    stopPing,
    openRoom,
    closeRoom,
  }
}
