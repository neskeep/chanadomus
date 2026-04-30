<script setup lang="ts">
import {
  Globe,
  Home,
  Shield,
  Settings,
  MessageCircle,
  Search,
  Wifi,
  WifiOff,
} from 'lucide-vue-next'
import type { ChatRoom, ChatRoomType } from '~~/shared/types/chat'
import { CHAT_CHANNEL_COLORS } from '~/composables/useColorMap'
import { useMediaQuery } from '@vueuse/core'

useHead({ title: 'Chat' })

const { rooms, isLoading, error, fetchRooms } = useChatRooms()
const router = useRouter()

const isDesktop = useMediaQuery('(min-width: 768px)')
const activeRoomId = ref<string | null>(null)
const searchQuery = ref('')
const conversationConnected = ref(false)

const ROOM_TYPE_CONFIG: Record<ChatRoomType, { label: string; icon: typeof Globe; iconBg: string; iconColor: string }> = {
  general: { label: 'General', icon: Globe, ...CHAT_CHANNEL_COLORS.general },
  unit: { label: 'Mi Rancho', icon: Home, ...CHAT_CHANNEL_COLORS.unit },
  vigilancia: { label: 'Vigilancia', icon: Shield, ...CHAT_CHANNEL_COLORS.vigilancia },
  admin: { label: 'Admin', icon: Settings, ...CHAT_CHANNEL_COLORS.admin },
}

// Separate rooms by category
const channelRooms = computed(() =>
  rooms.value.filter(r => r.type !== 'unit'),
)

const unitRooms = computed(() => {
  const units = rooms.value.filter(r => r.type === 'unit')
  if (!searchQuery.value.trim()) return units
  const q = searchQuery.value.toLowerCase().trim()
  return units.filter(r => r.name.toLowerCase().includes(q))
})

const hasUnitRooms = computed(() =>
  rooms.value.some(r => r.type === 'unit'),
)

const showSearch = computed(() =>
  rooms.value.filter(r => r.type === 'unit').length > 5,
)

const activeRoom = computed(() =>
  activeRoomId.value ? rooms.value.find(r => r.id === activeRoomId.value) : null,
)

const activeRoomName = computed(() => activeRoom.value?.name ?? 'Chat')

function selectRoom(room: ChatRoom) {
  if (isDesktop.value) {
    activeRoomId.value = room.id
  } else {
    router.push(`/mi-chana/chat/${room.id}`)
  }
}

function formatLastMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) {
    return date.toLocaleDateString('es-VE', { weekday: 'short' })
  }
  return date.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' })
}

function truncateMessage(content: string, max = 40): string {
  if (content.length <= max) return content
  return content.slice(0, max).trimEnd() + '...'
}

function handleConnectionChange(connected: boolean) {
  conversationConnected.value = connected
}

onMounted(() => {
  fetchRooms()
})
</script>

<template>
  <div class="absolute inset-0 flex pb-[4.5rem] md:pb-0">
    <!-- Room list: full width on mobile, sidebar on desktop -->
    <div
      class="flex w-full shrink-0 flex-col overflow-hidden md:w-80 md:border-r lg:w-96"
    >
      <!-- Header -->
      <div class="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <h2 class="text-base font-semibold">Mensajes</h2>
      </div>

      <!-- Search (only when many unit rooms) -->
      <div v-if="showSearch" class="shrink-0 border-b px-3 py-2">
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar rancho..."
            class="h-9 pl-9 text-sm"
          />
        </div>
      </div>

      <!-- Room list content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Error -->
        <ErrorAlert v-if="error" :message="error" class="m-3" />

        <!-- Loading -->
        <div v-else-if="isLoading" class="divide-y">
          <div v-for="i in 6" :key="i" class="flex items-center gap-3 px-4 py-3">
            <Skeleton class="size-10 shrink-0 rounded-full" />
            <div class="flex-1 space-y-1.5">
              <Skeleton class="h-4 w-2/3" />
              <Skeleton class="h-3 w-full" />
            </div>
            <Skeleton class="h-3 w-10 shrink-0" />
          </div>
        </div>

        <!-- Room sections -->
        <template v-else>
          <!-- Empty state -->
          <EmptyState
            v-if="rooms.length === 0"
            :icon="MessageCircle"
            title="Sin conversaciones"
            description="Las conversaciones aparecerán aquí"
            class="py-12"
          />

          <template v-else>
            <!-- Canales section -->
            <div v-if="channelRooms.length > 0">
              <p class="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Canales
              </p>
              <button
                v-for="room in channelRooms"
                :key="room.id"
                class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                :class="activeRoomId === room.id ? 'bg-muted' : ''"
                @click="selectRoom(room)"
              >
                <div
                  class="flex size-10 shrink-0 items-center justify-center rounded-full"
                  :class="ROOM_TYPE_CONFIG[room.type].iconBg"
                >
                  <component
                    :is="ROOM_TYPE_CONFIG[room.type].icon"
                    class="size-4.5"
                    :class="ROOM_TYPE_CONFIG[room.type].iconColor"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline justify-between gap-2">
                    <p class="truncate text-sm font-medium">{{ room.name }}</p>
                    <span
                      v-if="room.lastMessage"
                      class="shrink-0 text-[11px] tabular-nums text-muted-foreground"
                    >
                      {{ formatLastMessageTime(room.lastMessage.createdAt) }}
                    </span>
                  </div>
                  <p
                    v-if="room.lastMessage"
                    class="truncate text-xs text-muted-foreground"
                  >
                    <span class="font-medium">{{ room.lastMessage.userName.split(' ')[0] }}:</span>
                    {{ truncateMessage(room.lastMessage.content) }}
                  </p>
                  <p v-else class="text-xs text-muted-foreground/60">
                    Sin mensajes
                  </p>
                </div>
              </button>
            </div>

            <!-- Ranchos section -->
            <div v-if="hasUnitRooms">
              <p class="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ranchos
                <span class="ml-1 text-muted-foreground/60">
                  ({{ rooms.filter(r => r.type === 'unit').length }})
                </span>
              </p>

              <!-- No results from search -->
              <p
                v-if="unitRooms.length === 0 && searchQuery.trim()"
                class="px-4 py-6 text-center text-xs text-muted-foreground"
              >
                No se encontraron ranchos
              </p>

              <button
                v-for="room in unitRooms"
                :key="room.id"
                class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                :class="activeRoomId === room.id ? 'bg-muted' : ''"
                @click="selectRoom(room)"
              >
                <div
                  class="flex size-10 shrink-0 items-center justify-center rounded-full"
                  :class="ROOM_TYPE_CONFIG.unit.iconBg"
                >
                  <Home
                    class="size-4.5"
                    :class="ROOM_TYPE_CONFIG.unit.iconColor"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline justify-between gap-2">
                    <p class="truncate text-sm font-medium">{{ room.name }}</p>
                    <span
                      v-if="room.lastMessage"
                      class="shrink-0 text-[11px] tabular-nums text-muted-foreground"
                    >
                      {{ formatLastMessageTime(room.lastMessage.createdAt) }}
                    </span>
                  </div>
                  <p
                    v-if="room.lastMessage"
                    class="truncate text-xs text-muted-foreground"
                  >
                    <span class="font-medium">{{ room.lastMessage.userName.split(' ')[0] }}:</span>
                    {{ truncateMessage(room.lastMessage.content) }}
                  </p>
                  <p v-else class="text-xs text-muted-foreground/60">
                    Sin mensajes
                  </p>
                </div>
              </button>
            </div>
          </template>
        </template>
      </div>
    </div>

    <!-- Desktop conversation panel -->
    <div class="hidden flex-1 flex-col md:flex">
      <!-- Active conversation -->
      <template v-if="activeRoomId">
        <!-- Conversation header -->
        <div class="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <div class="flex items-center gap-2">
            <div
              v-if="activeRoom"
              class="flex size-8 items-center justify-center rounded-full"
              :class="ROOM_TYPE_CONFIG[activeRoom.type].iconBg"
            >
              <component
                :is="ROOM_TYPE_CONFIG[activeRoom.type].icon"
                class="size-4"
                :class="ROOM_TYPE_CONFIG[activeRoom.type].iconColor"
              />
            </div>
            <p class="text-sm font-semibold">{{ activeRoomName }}</p>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <component
              :is="conversationConnected ? Wifi : WifiOff"
              class="size-3.5"
              :class="conversationConnected ? 'text-primary' : 'text-destructive'"
            />
            <span :class="conversationConnected ? 'text-primary' : 'text-destructive'">
              {{ conversationConnected ? 'Conectado' : 'Desconectado' }}
            </span>
          </div>
        </div>

        <!-- Conversation body -->
        <ChatConversation
          :key="activeRoomId"
          :room-id="activeRoomId"
          :room-name="activeRoomName"
          class="flex-1"
          @connection-change="handleConnectionChange"
        />
      </template>

      <!-- Empty state: no room selected -->
      <div v-else class="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <div class="flex size-16 items-center justify-center rounded-full bg-muted">
          <MessageCircle class="size-7 text-muted-foreground" />
        </div>
        <div>
          <p class="text-sm font-medium text-muted-foreground">Selecciona una conversacion</p>
          <p class="mt-0.5 text-xs text-muted-foreground/60">Elige un canal o rancho para comenzar</p>
        </div>
      </div>
    </div>
  </div>
</template>
