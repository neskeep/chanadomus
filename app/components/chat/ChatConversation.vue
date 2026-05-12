<script setup lang="ts">
import {
  Send,
  Loader2,
} from 'lucide-vue-next'
import type { ChatMessage } from '~~/shared/types/chat'

const props = defineProps<{
  roomId: string
  roomName?: string
}>()

const emit = defineEmits<{
  connectionChange: [connected: boolean]
}>()

const { user } = useAuth()

const roomIdRef = computed(() => props.roomId)
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
} = useChatRoom(roomIdRef)

const messageInput = ref('')
const messagesContainer = ref<HTMLDivElement | null>(null)
const isUserScrolledUp = ref(false)
const isLoadingMore = ref(false)

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
  isUserScrolledUp.value = scrollHeight - scrollTop - clientHeight > 100
}

async function handleSend() {
  const content = messageInput.value.trim()
  if (!content || !connected.value) return

  const sent = await sendMessage(content)
  if (sent) {
    messageInput.value = ''
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

// Emit connection status changes
watch(connected, (val) => {
  emit('connectionChange', val)
})

onMounted(async () => {
  await openRoom()
  await nextTick()
  scrollToBottom()
})

onBeforeUnmount(() => {
  closeRoom()
})

// Expose connected status
defineExpose({ connected })
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
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
          <Skeleton v-if="i % 2 !== 0" class="size-7 shrink-0 rounded-lg" />
          <div :class="i % 2 === 0 ? 'items-end' : 'items-start'" class="flex flex-col gap-1">
            <Skeleton v-if="i % 2 !== 0" class="h-3 w-16" />
            <Skeleton class="h-8 rounded-lg" :class="i % 2 === 0 ? 'w-40' : 'w-48'" />
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
      <div v-else class="space-y-3">
        <div v-for="(group, gi) in messageGroups" :key="gi">
          <!-- Own messages (right-aligned) -->
          <div v-if="group.isOwn" class="flex flex-col items-end gap-0.5">
            <div
              v-for="msg in group.messages"
              :key="msg.id"
              class="max-w-3/4 rounded-xl rounded-br-sm bg-primary px-3.5 py-2 text-primary-foreground"
            >
              <p class="text-base leading-relaxed whitespace-pre-wrap break-words">{{ msg.content }} <span class="ml-2 inline-block translate-y-px text-[11px] leading-none text-primary-foreground/80">{{ formatTime(msg.createdAt) }}</span></p>
            </div>
          </div>

          <!-- Other's messages (left-aligned) -->
          <div v-else class="max-w-3/4">
            <div class="mb-1 flex items-center gap-1.5 pl-1">
              <div v-if="group.userImage" class="size-5 shrink-0 overflow-hidden rounded-lg">
                <img :src="group.userImage" :alt="group.userName" class="size-full object-cover" />
              </div>
              <div
                v-else
                class="flex size-5 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[9px] font-bold text-primary"
              >
                {{ getInitials(group.userName) }}
              </div>
              <span class="text-xs font-semibold text-primary">{{ group.userName }}</span>
            </div>

            <div class="flex flex-col gap-0.5 pl-6.5">
              <div
                v-for="msg in group.messages"
                :key="msg.id"
                class="self-start rounded-xl rounded-bl-sm bg-stone-200 px-3.5 py-2"
              >
                <p class="text-base leading-relaxed whitespace-pre-wrap break-words text-foreground">{{ msg.content }} <span class="ml-2 inline-block translate-y-px text-[11px] leading-none text-muted-foreground">{{ formatTime(msg.createdAt) }}</span></p>
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
    <div class="flex shrink-0 items-center gap-2 bg-background px-4 py-3">
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
