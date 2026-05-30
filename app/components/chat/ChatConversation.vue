<script setup lang="ts">
import {
  Send,
  Loader2,
  ImagePlus,
  X,
  AlertTriangle,
  Megaphone,
  Calendar,
  Vote,
  Building2,
  BookOpen,
  Search,
  AtSign,
} from 'lucide-vue-next'
import type { ChatMessage, ChatCommandResult, ChatMentionResult  } from '~~/shared/types/chat'

const props = defineProps<{
  roomId: string
  roomName?: string
}>()

const emit = defineEmits<{
  connectionChange: [connected: boolean]
}>()

const { user } = useAuth()
const userRole = computed(() => (user.value as Record<string, unknown>)?.role as string ?? '')
const messageInput = ref('')

// Command/mention system
const commands = useChatCommands(messageInput, userRole)

const COMMAND_ICON_MAP: Record<string, Component> = {
  'alert-triangle': AlertTriangle,
  'megaphone': Megaphone,
  'calendar': Calendar,
  'vote': Vote,
  'building-2': Building2,
  'book-open': BookOpen,
}

const roomIdRef = computed(() => props.roomId)
const {
  messages,
  isLoading,
  isUploading,
  connected,
  error,
  hasMore,
  loadOlderMessages,
  sendMessage,
  sendImages,
  openRoom,
  closeRoom,
} = useChatRoom(roomIdRef)

const route = useRoute()
const messagesContainer = ref<HTMLDivElement | null>(null)
const chatInputRef = ref<HTMLInputElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isUserScrolledUp = ref(false)
const isLoadingMore = ref(false)
const pendingImages = ref<File[]>([])
const pendingPreviews = ref<string[]>([])

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

function openFilePicker() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files) return

  const newFiles = Array.from(input.files)
  const combined = [...pendingImages.value, ...newFiles].slice(0, 5)
  pendingImages.value = combined

  // Generate previews
  pendingPreviews.value = []
  for (const f of combined) {
    const url = URL.createObjectURL(f)
    pendingPreviews.value.push(url)
  }

  // Reset input so same file can be re-selected
  input.value = ''
}

function removePendingImage(index: number) {
  URL.revokeObjectURL(pendingPreviews.value[index]!)
  pendingImages.value.splice(index, 1)
  pendingPreviews.value.splice(index, 1)
}

function clearPendingImages() {
  pendingPreviews.value.forEach(url => URL.revokeObjectURL(url))
  pendingImages.value = []
  pendingPreviews.value = []
}

async function handleSend() {
  if (!connected.value && pendingImages.value.length === 0) return

  const content = messageInput.value.trim()
  const hasImages = pendingImages.value.length > 0

  if (!content && !hasImages) return

  if (hasImages) {
    const files = [...pendingImages.value]
    clearPendingImages()
    messageInput.value = ''
    const sent = await sendImages(files, content)
    if (sent) {
      await nextTick()
      scrollToBottom()
    }
  } else {
    const sent = await sendMessage(content)
    if (sent) {
      messageInput.value = ''
      await nextTick()
      scrollToBottom()
    }
  }
}

function handleInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  commands.detectTrigger(target.value, target.selectionStart ?? target.value.length)
}

function handleKeydown(event: KeyboardEvent) {
  // Let command system handle keyboard first
  if (commands.handleKeydown(event)) {
    event.preventDefault()
    return
  }
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

function isCommandResult(item: ChatCommandResult | ChatMentionResult): item is ChatCommandResult {
  return 'type' in item && 'label' in item
}

function isMentionResult(item: ChatCommandResult | ChatMentionResult): item is ChatMentionResult {
  return 'name' in item && 'role' in item
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

  // Pre-fill message from query param (e.g. panic alert redirect)
  const prefill = route.query.msg as string | undefined
  if (prefill) {
    messageInput.value = prefill
  }
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
              class="max-w-3/4"
            >
              <!-- Image attachments -->
              <div
                v-if="msg.attachments && msg.attachments.length > 0"
                class="mb-0.5 flex flex-wrap justify-end gap-1"
              >
                <a
                  v-for="att in msg.attachments"
                  :key="att.id"
                  :href="`/api/chat/attachments/${att.filePath}`"
                  target="_blank"
                  class="block overflow-hidden rounded-xl"
                >
                  <img
                    :src="`/api/chat/attachments/${att.filePath}`"
                    :width="att.width ?? undefined"
                    :height="att.height ?? undefined"
                    loading="lazy"
                    class="max-h-64 max-w-56 rounded-xl object-cover transition-opacity hover:opacity-90 md:max-w-72"
                    alt="Imagen"
                  >
                </a>
              </div>
              <!-- Text content -->
              <div
                v-if="msg.content"
                class="rounded-xl rounded-br-sm bg-primary px-3.5 py-2 text-primary-foreground"
              >
                <p class="text-base leading-relaxed"><ChatMessageContent :content="msg.content" is-own /> <span class="ml-2 inline-block translate-y-px text-[11px] leading-none text-primary-foreground/80">{{ formatTime(msg.createdAt) }}</span></p>
              </div>
              <span
                v-else
                class="mt-0.5 inline-block text-[11px] leading-none text-muted-foreground"
              >{{ formatTime(msg.createdAt) }}</span>
            </div>
          </div>

          <!-- Other's messages (left-aligned) -->
          <div v-else class="max-w-3/4">
            <div class="mb-1 flex items-center gap-1.5 pl-1">
              <div v-if="group.userImage" class="size-5 shrink-0 overflow-hidden rounded-lg">
                <img :src="group.userImage" :alt="group.userName" class="size-full object-cover" >
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
                class="self-start"
              >
                <!-- Image attachments -->
                <div
                  v-if="msg.attachments && msg.attachments.length > 0"
                  class="mb-0.5 flex flex-wrap gap-1"
                >
                  <a
                    v-for="att in msg.attachments"
                    :key="att.id"
                    :href="`/api/chat/attachments/${att.filePath}`"
                    target="_blank"
                    class="block overflow-hidden rounded-xl"
                  >
                    <img
                      :src="`/api/chat/attachments/${att.filePath}`"
                      :width="att.width ?? undefined"
                      :height="att.height ?? undefined"
                      loading="lazy"
                      class="max-h-64 max-w-56 rounded-xl object-cover transition-opacity hover:opacity-90 md:max-w-72"
                      alt="Imagen"
                    >
                  </a>
                </div>
                <!-- Text content -->
                <div
                  v-if="msg.content"
                  class="rounded-xl rounded-bl-sm bg-stone-200 px-3.5 py-2"
                >
                  <p class="text-base leading-relaxed text-foreground"><ChatMessageContent :content="msg.content" /> <span class="ml-2 inline-block translate-y-px text-[11px] leading-none text-muted-foreground">{{ formatTime(msg.createdAt) }}</span></p>
                </div>
                <span
                  v-else
                  class="mt-0.5 inline-block text-[11px] leading-none text-muted-foreground"
                >{{ formatTime(msg.createdAt) }}</span>
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

    <!-- Pending images preview -->
    <div
      v-if="pendingPreviews.length > 0"
      class="flex shrink-0 gap-2 overflow-x-auto border-t bg-muted/30 px-4 py-2"
    >
      <div
        v-for="(preview, idx) in pendingPreviews"
        :key="idx"
        class="relative shrink-0"
      >
        <img
          :src="preview"
          class="size-16 rounded-lg object-cover"
          alt="Preview"
        >
        <button
          class="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm"
          @click="removePendingImage(idx)"
        >
          <X class="size-3" />
        </button>
      </div>
    </div>

    <!-- Command/Mention dropdown -->
    <div v-if="commands.isActive.value" class="relative shrink-0">
      <div class="absolute bottom-0 left-4 right-4 z-10 max-h-64 overflow-y-auto rounded-lg border bg-popover shadow-lg">
        <!-- Command type selection -->
        <template v-if="commands.mode.value === 'command-type'">
          <div class="px-3 py-1.5 text-xs font-medium text-muted-foreground">Comandos</div>
          <button
            v-for="(cmd, idx) in commands.filteredCommandTypes.value"
            :key="cmd.type"
            class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors"
            :class="idx === commands.selectedIndex.value ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'"
            @mousedown.prevent="commands.selectCommandType(cmd)"
            @mouseenter="commands.selectedIndex.value = idx"
          >
            <component :is="COMMAND_ICON_MAP[cmd.icon]" class="size-4 shrink-0 text-muted-foreground" />
            <span class="font-medium">{{ cmd.label }}</span>
          </button>
          <div v-if="commands.filteredCommandTypes.value.length === 0" class="px-3 py-2 text-sm text-muted-foreground">
            Sin comandos disponibles
          </div>
        </template>

        <!-- Command search results -->
        <template v-else-if="commands.mode.value === 'command-search'">
          <div class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Search class="size-3" />
            Buscando {{ commands.selectedCommandType.value }}...
          </div>
          <div v-if="commands.isSearching.value" class="flex items-center gap-2 px-3 py-2">
            <Loader2 class="size-4 animate-spin text-muted-foreground" />
            <span class="text-sm text-muted-foreground">Buscando...</span>
          </div>
          <template v-else>
            <button
              v-for="(item, idx) in commands.results.value"
              :key="isCommandResult(item) ? item.id : idx"
              class="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors"
              :class="idx === commands.selectedIndex.value ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'"
              @mousedown.prevent="commands.selectResult(idx)"
              @mouseenter="commands.selectedIndex.value = idx"
            >
              <span class="text-sm font-medium">{{ isCommandResult(item) ? item.label : '' }}</span>
              <span v-if="isCommandResult(item) && item.sublabel" class="text-xs text-muted-foreground">{{ item.sublabel }}</span>
            </button>
            <div v-if="commands.results.value.length === 0 && commands.searchQuery.value.length > 0" class="px-3 py-2 text-sm text-muted-foreground">
              Sin resultados
            </div>
            <div v-else-if="commands.searchQuery.value.length === 0" class="px-3 py-2 text-sm text-muted-foreground">
              Escribe para buscar...
            </div>
          </template>
        </template>

        <!-- Mention results -->
        <template v-else-if="commands.mode.value === 'mention'">
          <div class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <AtSign class="size-3" />
            Mencionar usuario
          </div>
          <div v-if="commands.isSearching.value" class="flex items-center gap-2 px-3 py-2">
            <Loader2 class="size-4 animate-spin text-muted-foreground" />
            <span class="text-sm text-muted-foreground">Buscando...</span>
          </div>
          <template v-else>
            <button
              v-for="(item, idx) in commands.results.value"
              :key="isMentionResult(item) ? item.id : idx"
              class="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors"
              :class="idx === commands.selectedIndex.value ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'"
              @mousedown.prevent="commands.selectResult(idx)"
              @mouseenter="commands.selectedIndex.value = idx"
            >
              <div v-if="isMentionResult(item) && item.image" class="size-6 shrink-0 overflow-hidden rounded-lg">
                <img :src="item.image" :alt="item.name" class="size-full object-cover" >
              </div>
              <div
                v-else-if="isMentionResult(item)"
                class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[9px] font-bold text-primary"
              >
                {{ getInitials(item.name) }}
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-medium">{{ isMentionResult(item) ? item.name : '' }}</span>
                <span class="text-xs capitalize text-muted-foreground">{{ isMentionResult(item) ? item.role : '' }}</span>
              </div>
            </button>
            <div v-if="commands.results.value.length === 0 && commands.searchQuery.value.length > 0" class="px-3 py-2 text-sm text-muted-foreground">
              Sin resultados
            </div>
          </template>
        </template>
      </div>
    </div>

    <!-- Input area -->
    <div class="flex shrink-0 items-center gap-2 bg-background px-4 py-3">
      <!-- Hidden file input -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif,image/gif"
        multiple
        class="hidden"
        @change="handleFileSelect"
      >

      <!-- Image upload button -->
      <Button
        variant="ghost"
        size="icon"
        class="shrink-0"
        :disabled="isUploading || pendingImages.length >= 5"
        aria-label="Adjuntar imágenes"
        @click="openFilePicker"
      >
        <ImagePlus class="size-5 text-muted-foreground" />
      </Button>

      <Input
        ref="chatInputRef"
        v-model="messageInput"
        :placeholder="pendingImages.length > 0 ? 'Agrega un texto (opcional)...' : 'Escribe un mensaje... (/ para comandos, @ para menciones)'"
        class="flex-1"
        :disabled="isUploading"
        @input="handleInputChange"
        @keydown="handleKeydown"
      />

      <Button
        size="icon"
        :disabled="isUploading || (!connected && pendingImages.length === 0) || (!messageInput.trim() && pendingImages.length === 0)"
        aria-label="Enviar mensaje"
        @click="handleSend"
      >
        <Loader2 v-if="isUploading" class="size-4 animate-spin" />
        <Send v-else class="size-4" />
      </Button>
    </div>
  </div>
</template>
