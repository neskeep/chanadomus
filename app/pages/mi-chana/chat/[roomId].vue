<script setup lang="ts">
import {
  ChevronLeft,
  Send,
  Loader2,
} from 'lucide-vue-next'
import type { ChatMessage } from '~~/shared/types/chat'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const roomId = computed(() => route.params.roomId as string)
const { rooms, fetchRooms } = useChatRooms()
const {
  messages,
  isLoading,
  connected,
  error,
  hasMore,
  loadOlderMessages,
  sendMessage,
  openRoom,
  closeRoom,
} = useChatRoom(roomId)

const messageInput = ref('')
const messagesContainer = ref<HTMLDivElement | null>(null)
const isUserScrolledUp = ref(false)
const isLoadingMore = ref(false)

const roomName = computed(() => {
  const room = rooms.value.find(r => r.id === roomId.value)
  return room?.name ?? 'Chat'
})

// Group consecutive messages from the same sender
interface MessageGroup {
  userId: string
  userName: string
  userImage: string | null
  isOwn: boolean
  messages: ChatMessage[]
}

const messageGroups = computed((): MessageGroup[] => {
  const groups: MessageGroup[] = []
  for (const msg of messages.value) {
    const isOwn = msg.userId === user.value?.id
    const last = groups[groups.length - 1]
    if (last && last.userId === msg.userId) {
      last.messages.push(msg)
    } else {
      groups.push({
        userId: msg.userId,
        userName: msg.user?.name ?? 'Usuario',
        userImage: msg.user?.image ?? null,
        isOwn,
        messages: [msg],
      })
    }
  }
  return groups
})

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function handleScroll() {
  if (!messagesContainer.value) return
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  // Consider "scrolled up" if more than 100px from bottom
  isUserScrolledUp.value = scrollHeight - scrollTop - clientHeight > 100
}

async function handleSend() {
  const content = messageInput.value.trim()
  if (!content || !connected.value) return

  const sent = await sendMessage(content)
  if (sent) {
    messageInput.value = ''
    // Always scroll to bottom when user sends their own message
    await nextTick()
    scrollToBottom()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

async function handleLoadMore() {
  if (isLoadingMore.value || !hasMore.value) return
  isLoadingMore.value = true
  const container = messagesContainer.value
  const prevScrollHeight = container?.scrollHeight ?? 0

  await loadOlderMessages()

  // Preserve scroll position after loading older messages
  await nextTick()
  if (container) {
    container.scrollTop = container.scrollHeight - prevScrollHeight
  }
  isLoadingMore.value = false
}

// Watch for new messages and auto-scroll if not scrolled up
watch(
  () => messages.value.length,
  async () => {
    if (!isUserScrolledUp.value) {
      await nextTick()
      scrollToBottom()
    }
  },
)

onMounted(async () => {
  await fetchRooms()
  await openRoom()
  await nextTick()
  scrollToBottom()
})

onBeforeUnmount(() => {
  closeRoom()
})
</script>

<template>
  <div class="-mx-4 -mt-6 -mb-6 flex flex-col h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-3.5rem)]">
    <!-- Chat header -->
    <div class="flex shrink-0 items-center gap-3 border-b bg-background px-4 py-3">
      <button
        type="button"
        class="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
        aria-label="Volver a salas de chat"
        @click="router.push('/mi-chana/chat')"
      >
        <ChevronLeft class="size-5" />
      </button>
      <h1 class="min-w-0 flex-1 truncate text-sm font-semibold">{{ roomName }}</h1>
      <span
        class="size-2 shrink-0 rounded-full"
        :class="connected ? 'bg-emerald-500' : 'bg-red-500'"
        :aria-label="connected ? 'Conectado' : 'Desconectado'"
        role="status"
      />
    </div>

    <!-- Messages area -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4"
      @scroll="handleScroll"
    >
      <!-- Load more -->
      <div v-if="hasMore" class="mb-4 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          :disabled="isLoadingMore"
          @click="handleLoadMore"
        >
          <Loader2 v-if="isLoadingMore" class="mr-1.5 size-4 animate-spin" />
          Cargar mensajes anteriores
        </Button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex gap-2" :class="i % 2 === 0 ? 'justify-end' : ''">
          <Skeleton v-if="i % 2 !== 0" class="size-7 shrink-0 rounded-full" />
          <div :class="i % 2 === 0 ? 'items-end' : 'items-start'" class="flex flex-col gap-1">
            <Skeleton v-if="i % 2 !== 0" class="h-3 w-16" />
            <Skeleton class="h-8 rounded-2xl" :class="i % 2 === 0 ? 'w-40' : 'w-48'" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="messages.length === 0"
        class="flex h-full flex-col items-center justify-center gap-2 text-center"
      >
        <p class="text-sm text-muted-foreground">No hay mensajes aun</p>
        <p class="text-xs text-muted-foreground">Se el primero en escribir</p>
      </div>

      <!-- Message groups -->
      <div v-else class="space-y-4">
        <div v-for="(group, gi) in messageGroups" :key="gi">
          <!-- Own messages (right-aligned) -->
          <div v-if="group.isOwn" class="flex flex-col items-end gap-0.5">
            <div
              v-for="(msg, mi) in group.messages"
              :key="msg.id"
              class="max-w-[80%]"
            >
              <div class="rounded-2xl rounded-br-md bg-primary px-3 py-2 text-primary-foreground">
                <p class="text-sm whitespace-pre-wrap break-words">{{ msg.content }}</p>
              </div>
              <p
                v-if="mi === group.messages.length - 1"
                class="mt-0.5 text-right text-xs text-muted-foreground"
              >
                {{ formatTime(msg.createdAt) }}
              </p>
            </div>
          </div>

          <!-- Other's messages (left-aligned) -->
          <div v-else class="flex items-start gap-2">
            <!-- Avatar (only for first message in group) -->
            <div
              class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
              :aria-label="group.userName"
            >
              {{ getInitials(group.userName) }}
            </div>

            <div class="flex min-w-0 flex-col gap-0.5">
              <!-- Sender name -->
              <p class="text-xs font-medium text-muted-foreground">{{ group.userName }}</p>

              <div
                v-for="(msg, mi) in group.messages"
                :key="msg.id"
                class="max-w-[80%]"
              >
                <div class="rounded-2xl rounded-bl-md bg-muted px-3 py-2">
                  <p class="text-sm whitespace-pre-wrap break-words">{{ msg.content }}</p>
                </div>
                <p
                  v-if="mi === group.messages.length - 1"
                  class="mt-0.5 text-xs text-muted-foreground"
                >
                  {{ formatTime(msg.createdAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Connection status banner -->
    <div
      v-if="!connected && !isLoading"
      class="flex shrink-0 items-center justify-center gap-2 bg-destructive/10 px-4 py-1.5 text-xs text-destructive"
    >
      <Loader2 class="size-3 animate-spin" />
      {{ error || 'Reconectando...' }}
    </div>

    <!-- Input area -->
    <div class="flex shrink-0 items-center gap-2 border-t bg-background px-4 py-3">
      <Input
        v-model="messageInput"
        placeholder="Escribe un mensaje..."
        class="flex-1"
        @keydown="handleKeydown"
      />
      <Button
        size="icon"
        :disabled="!connected || !messageInput.trim()"
        aria-label="Enviar mensaje"
        @click="handleSend"
      >
        <Send class="size-4" />
      </Button>
    </div>
  </div>
</template>
