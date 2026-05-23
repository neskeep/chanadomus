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
  Contact,
} from 'lucide-vue-next'
import type { ChatRoom, ChatRoomType, ChatContact } from '~~/shared/types/chat'
import { ROLE_LABELS, type UserRole } from '~~/shared/types/auth'
import { CHAT_CHANNEL_COLORS } from '~/composables/useColorMap'

const router = useRouter()
const route = useRoute()

const { rooms, isLoading, error, fetchRooms, groupRooms, directRooms } = useChatRooms()
const {
  filteredContacts,
  isLoading: contactsLoading,
  error: contactsError,
  searchQuery: contactsSearch,
  fetchContacts,
  startConversation,
} = useChatContacts()

const activeTab = ref<'chat' | 'contacts'>('chat')
const isStartingConversation = ref(false)

const ROOM_TYPE_CONFIG: Record<ChatRoomType, { label: string; icon: typeof Globe; iconBg: string; iconColor: string }> = {
  general: { label: 'General', icon: Globe, ...CHAT_CHANNEL_COLORS.general },
  unit: { label: 'Mi Rancho', icon: Home, ...CHAT_CHANNEL_COLORS.unit },
  vigilancia: { label: 'Vigilancia', icon: Shield, ...CHAT_CHANNEL_COLORS.vigilancia },
  admin: { label: 'Admin', icon: Settings, ...CHAT_CHANNEL_COLORS.admin },
  conserjeria: { label: 'Conserjería', icon: HardHat, ...CHAT_CHANNEL_COLORS.conserjeria },
  incidencias: { label: 'Incidencias', icon: AlertTriangle, ...CHAT_CHANNEL_COLORS.incidencias },
  propietarios: { label: 'Propietarios', icon: Users, ...CHAT_CHANNEL_COLORS.propietarios },
  direct: { label: 'Directo', icon: MessageCircle, ...CHAT_CHANNEL_COLORS.direct },
}

// Active room derived from route (SSR-safe — no useMediaQuery)
const activeRoomId = computed(() => {
  const roomId = route.params.roomId as string | undefined
  return roomId ?? null
})

const isOnRoom = computed(() => !!activeRoomId.value)

function selectRoom(room: ChatRoom) {
  router.push(`/mi-chana/chat/${room.id}`)
}

async function handleContactClick(contact: ChatContact) {
  if (contact.existingRoomId) {
    activeTab.value = 'chat'
    router.push(`/mi-chana/chat/${contact.existingRoomId}`)
    return
  }

  isStartingConversation.value = true
  try {
    const roomId = await startConversation(contact.id)
    await fetchRooms()
    activeTab.value = 'chat'
    router.push(`/mi-chana/chat/${roomId}`)
  }
  catch {
    // Error is handled by composable
  }
  finally {
    isStartingConversation.value = false
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
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

// Lazy-load contacts when switching to that tab
watch(activeTab, (tab) => {
  if (tab === 'contacts' && filteredContacts.value.length === 0 && !contactsLoading.value) {
    fetchContacts()
  }
})

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
      - Mobile: visible only when NOT on a room
    -->
    <div
      class="w-full shrink-0 flex-col overflow-hidden bg-stone-50 md:!flex md:w-80 md:border-r lg:w-96"
      :class="isOnRoom ? 'hidden' : 'flex'"
    >
      <!-- Tab switcher (h matched to room header: px-4 py-2.5 + size-8 element) -->
      <div class="flex h-[53px] shrink-0 items-end border-b">
        <button
          class="flex flex-1 items-center justify-center gap-1.5 pb-2.5 text-xs font-semibold transition-colors"
          :class="activeTab === 'chat'
            ? 'border-b-2 border-primary text-primary'
            : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'chat'"
        >
          <MessageCircle class="size-3.5" />
          Chat
        </button>
        <button
          class="flex flex-1 items-center justify-center gap-1.5 pb-2.5 text-xs font-semibold transition-colors"
          :class="activeTab === 'contacts'
            ? 'border-b-2 border-primary text-primary'
            : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'contacts'"
        >
          <Contact class="size-3.5" />
          Contactos
        </button>
      </div>

      <!-- Tab content -->
      <div class="flex-1 overflow-y-auto">
        <!-- ===== CHAT TAB ===== -->
        <template v-if="activeTab === 'chat'">
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
              <!-- Grupos section -->
              <div v-if="groupRooms.length > 0">
                <p class="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Grupos
                </p>
                <button
                  v-for="room in groupRooms"
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

              <!-- Conversaciones section (active DMs) -->
              <div v-if="directRooms.length > 0">
                <p class="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Conversaciones
                </p>
                <button
                  v-for="room in directRooms"
                  :key="room.id"
                  class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  :class="activeRoomId === room.id ? 'bg-muted' : ''"
                  @click="selectRoom(room)"
                >
                  <!-- Avatar -->
                  <Avatar class="size-10 shrink-0">
                    <AvatarImage v-if="room.otherUser?.image" :src="room.otherUser.image" :alt="room.otherUser?.name ?? ''" />
                    <AvatarFallback class="bg-violet-100 text-sm font-medium text-violet-700">
                      {{ getInitials(room.otherUser?.name ?? '?') }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-baseline justify-between gap-2">
                      <p class="truncate text-sm" :class="room.unreadCount ? 'font-semibold text-foreground' : 'font-medium'">
                        {{ room.otherUser?.name ?? 'Conversación' }}
                      </p>
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
        </template>

        <!-- ===== CONTACTS TAB ===== -->
        <template v-if="activeTab === 'contacts'">
          <!-- Search -->
          <div class="shrink-0 border-b px-3 py-2">
            <div class="relative">
              <Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-model="contactsSearch"
                placeholder="Buscar contacto..."
                class="h-9 pl-9 text-sm"
              />
            </div>
          </div>

          <!-- Error -->
          <ErrorAlert v-if="contactsError" :message="contactsError" class="m-3" />

          <!-- Loading -->
          <div v-else-if="contactsLoading" class="divide-y">
            <div v-for="i in 8" :key="i" class="flex items-center gap-3 px-4 py-3">
              <Skeleton class="size-10 shrink-0 rounded-full" />
              <div class="flex-1 space-y-1.5">
                <Skeleton class="h-4 w-2/3" />
                <Skeleton class="h-3 w-1/3" />
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <EmptyState
            v-else-if="filteredContacts.length === 0 && contactsSearch.trim()"
            :icon="Contact"
            title="Sin resultados"
            description="No se encontraron contactos"
            class="py-12"
          />

          <EmptyState
            v-else-if="filteredContacts.length === 0"
            :icon="Contact"
            title="Sin contactos"
            description="No hay contactos disponibles"
            class="py-12"
          />

          <!-- Contact list -->
          <div v-else class="divide-y">
            <button
              v-for="contact in filteredContacts"
              :key="contact.id"
              class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              :disabled="isStartingConversation"
              @click="handleContactClick(contact)"
            >
              <Avatar class="size-10 shrink-0">
                <AvatarImage v-if="contact.image" :src="contact.image" :alt="contact.name" />
                <AvatarFallback class="bg-muted text-sm font-medium">
                  {{ getInitials(contact.name) }}
                </AvatarFallback>
              </Avatar>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ contact.name }}</p>
                <div class="flex items-center gap-1.5">
                  <Badge variant="outline" class="h-4.5 px-1.5 text-[10px]">
                    {{ ROLE_LABELS[contact.role as UserRole] ?? contact.role }}
                  </Badge>
                  <span v-if="contact.unitLabel" class="truncate text-xs text-muted-foreground">
                    {{ contact.unitLabel }}
                  </span>
                </div>
              </div>
              <!-- Indicator if DM already exists -->
              <MessageCircle
                v-if="contact.existingRoomId"
                class="size-4 shrink-0 text-muted-foreground/40"
              />
            </button>
          </div>
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
