<script setup lang="ts">
import {
  Globe,
  Home,
  Shield,
  Settings,
  HardHat,
  AlertTriangle,
  Users,
  MessageCircle,
  Search,
} from 'lucide-vue-next'
import type { ChatRoom, ChatRoomType } from '~~/shared/types/chat'
import { CHAT_CHANNEL_COLORS } from '~/composables/useColorMap'

const router = useRouter()
const route = useRoute()

const { rooms, isLoading, error, fetchRooms } = useChatRooms()
const searchQuery = ref('')

const ROOM_TYPE_CONFIG: Record<ChatRoomType, { label: string; icon: typeof Globe; iconBg: string; iconColor: string }> = {
  general: { label: 'General', icon: Globe, ...CHAT_CHANNEL_COLORS.general },
  unit: { label: 'Mi Rancho', icon: Home, ...CHAT_CHANNEL_COLORS.unit },
  vigilancia: { label: 'Vigilancia', icon: Shield, ...CHAT_CHANNEL_COLORS.vigilancia },
  admin: { label: 'Admin', icon: Settings, ...CHAT_CHANNEL_COLORS.admin },
  conserjeria: { label: 'Conserjería', icon: HardHat, ...CHAT_CHANNEL_COLORS.conserjeria },
  incidencias: { label: 'Incidencias', icon: AlertTriangle, ...CHAT_CHANNEL_COLORS.incidencias },
  propietarios: { label: 'Propietarios', icon: Users, ...CHAT_CHANNEL_COLORS.propietarios },
}

// Active room derived from route (SSR-safe — no useMediaQuery)
const activeRoomId = computed(() => {
  const roomId = route.params.roomId as string | undefined
  return roomId ?? null
})

const isOnRoom = computed(() => !!activeRoomId.value)

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

function selectRoom(room: ChatRoom) {
  router.push(`/mi-chana/chat/${room.id}`)
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

// Refresh room list (and unread counts) when navigating back from a room
watch(activeRoomId, (newId, oldId) => {
  if (!newId && oldId) {
    fetchRooms()
  }
})

onMounted(() => {
  fetchRooms()
})
</script>

<template>
  <div class="absolute inset-0 flex pb-[4.5rem] md:pb-0">
    <!--
      Room list sidebar:
      - Desktop (md+): always visible via md:!flex
      - Mobile: visible only when NOT on a room (isOnRoom is SSR-safe, derived from route)
    -->
    <div
      class="w-full shrink-0 flex-col overflow-hidden bg-stone-50 md:!flex md:w-80 md:border-r lg:w-96"
      :class="isOnRoom ? 'hidden' : 'flex'"
    >
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
            <Skeleton class="size-10 shrink-0 rounded-lg" />
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
                  class="flex size-10 shrink-0 items-center justify-center rounded-lg"
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
                    <p class="truncate text-sm" :class="room.unreadCount ? 'font-semibold text-foreground' : 'font-medium'">{{ room.name }}</p>
                    <div class="flex shrink-0 items-center gap-1.5">
                      <span
                        v-if="room.lastMessage"
                        class="text-[11px] tabular-nums"
                        :class="room.unreadCount ? 'font-medium text-primary' : 'text-muted-foreground'"
                      >
                        {{ formatLastMessageTime(room.lastMessage.createdAt) }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <p
                      v-if="room.lastMessage"
                      class="min-w-0 truncate text-xs"
                      :class="room.unreadCount ? 'font-medium text-foreground' : 'text-muted-foreground'"
                    >
                      <span class="font-medium">{{ room.lastMessage.userName.split(' ')[0] }}:</span>
                      {{ truncateMessage(room.lastMessage.content) }}
                    </p>
                    <p v-else class="text-xs text-muted-foreground/60">
                      Sin mensajes
                    </p>
                    <span
                      v-if="room.unreadCount"
                      class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                    >
                      {{ room.unreadCount > 99 ? '99+' : room.unreadCount }}
                    </span>
                  </div>
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
                  class="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  :class="ROOM_TYPE_CONFIG.unit.iconBg"
                >
                  <Home
                    class="size-4.5"
                    :class="ROOM_TYPE_CONFIG.unit.iconColor"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline justify-between gap-2">
                    <p class="truncate text-sm" :class="room.unreadCount ? 'font-semibold text-foreground' : 'font-medium'">{{ room.name }}</p>
                    <div class="flex shrink-0 items-center gap-1.5">
                      <span
                        v-if="room.lastMessage"
                        class="text-[11px] tabular-nums"
                        :class="room.unreadCount ? 'font-medium text-primary' : 'text-muted-foreground'"
                      >
                        {{ formatLastMessageTime(room.lastMessage.createdAt) }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <p
                      v-if="room.lastMessage"
                      class="min-w-0 truncate text-xs"
                      :class="room.unreadCount ? 'font-medium text-foreground' : 'text-muted-foreground'"
                    >
                      <span class="font-medium">{{ room.lastMessage.userName.split(' ')[0] }}:</span>
                      {{ truncateMessage(room.lastMessage.content) }}
                    </p>
                    <p v-else class="text-xs text-muted-foreground/60">
                      Sin mensajes
                    </p>
                    <span
                      v-if="room.unreadCount"
                      class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                    >
                      {{ room.unreadCount > 99 ? '99+' : room.unreadCount }}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </template>
        </template>
      </div>
    </div>

    <!--
      Content area (NuxtPage child):
      - Desktop (md+): always visible via md:!flex
      - Mobile: visible only when ON a room
    -->
    <div
      class="min-h-0 flex-1 flex-col overflow-hidden md:!flex"
      :class="isOnRoom ? 'flex' : 'hidden'"
    >
      <NuxtPage :transition="false" />
    </div>
  </div>
</template>
