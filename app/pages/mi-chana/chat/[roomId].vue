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
  Wifi,
  WifiOff,
  ArrowLeft,
} from 'lucide-vue-next'
import type { ChatRoomType } from '~~/shared/types/chat'
import { CHAT_CHANNEL_COLORS } from '~/composables/useColorMap'

const route = useRoute()
const router = useRouter()

const roomId = computed(() => route.params.roomId as string)
const { rooms, fetchRooms } = useChatRooms()
const conversationConnected = ref(false)

const activeRoom = computed(() =>
  rooms.value.find(r => r.id === roomId.value) ?? null,
)

const isDirect = computed(() => activeRoom.value?.type === 'direct')
const otherUser = computed(() => activeRoom.value?.otherUser ?? null)
const roomName = computed(() => {
  if (isDirect.value && otherUser.value) return otherUser.value.name
  return activeRoom.value?.name ?? 'Chat'
})
const roomType = computed(() => activeRoom.value?.type ?? 'general')

const ROOM_TYPE_CONFIG: Record<ChatRoomType, { icon: typeof Globe; iconBg: string; iconColor: string }> = {
  general: { icon: Globe, ...CHAT_CHANNEL_COLORS.general },
  unit: { icon: Home, ...CHAT_CHANNEL_COLORS.unit },
  vigilancia: { icon: Shield, ...CHAT_CHANNEL_COLORS.vigilancia },
  admin: { icon: Settings, ...CHAT_CHANNEL_COLORS.admin },
  conserjeria: { icon: HardHat, ...CHAT_CHANNEL_COLORS.conserjeria },
  incidencias: { icon: AlertTriangle, ...CHAT_CHANNEL_COLORS.incidencias },
  propietarios: { icon: Users, ...CHAT_CHANNEL_COLORS.propietarios },
  direct: { icon: MessageCircle, ...CHAT_CHANNEL_COLORS.direct },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

// Override page info for breadcrumbs
const chatPageOverride = computed(() => ({
  title: roomName.value,
  breadcrumbs: [{ label: 'Chat', to: '/mi-chana/chat' }],
}))
usePageInfoOverride(chatPageOverride)

useHead({ title: computed(() => roomName.value) })

function handleConnectionChange(connected: boolean) {
  conversationConnected.value = connected
}

function goBack() {
  router.push('/mi-chana/chat')
}

onMounted(() => {
  if (rooms.value.length === 0) {
    fetchRooms()
  }
})
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Conversation header -->
    <div class="flex shrink-0 items-center justify-between border-b px-4 py-2.5">
      <div class="flex items-center gap-2">
        <!-- Back button: hidden on desktop via CSS to avoid hydration mismatch -->
        <Button
          variant="ghost"
          size="icon"
          class="-ml-2 size-8 md:hidden"
          @click="goBack"
        >
          <ArrowLeft class="size-4" />
        </Button>

        <!-- Direct message: show user avatar -->
        <template v-if="isDirect && otherUser">
          <Avatar class="size-8">
            <AvatarImage v-if="otherUser.image" :src="otherUser.image" :alt="otherUser.name" />
            <AvatarFallback class="bg-violet-100 text-xs font-medium text-violet-700">
              {{ getInitials(otherUser.name) }}
            </AvatarFallback>
          </Avatar>
        </template>

        <!-- Group room: show type icon -->
        <template v-else-if="activeRoom">
          <div
            class="flex size-8 items-center justify-center rounded-lg"
            :class="ROOM_TYPE_CONFIG[roomType].iconBg"
          >
            <component
              :is="ROOM_TYPE_CONFIG[roomType].icon"
              class="size-4"
              :class="ROOM_TYPE_CONFIG[roomType].iconColor"
            />
          </div>
        </template>

        <p class="text-sm font-semibold">{{ roomName }}</p>
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
      :key="roomId"
      :room-id="roomId"
      :room-name="roomName"
      class="min-h-0 flex-1"
      @connection-change="handleConnectionChange"
    />
  </div>
</template>
