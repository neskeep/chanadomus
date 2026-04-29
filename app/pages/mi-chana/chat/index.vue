<script setup lang="ts">
import {
  Globe,
  Home,
  Shield,
  Settings,
  ChevronRight,
  MessageCircle,
} from 'lucide-vue-next'
import type { ChatRoomType } from '~~/shared/types/chat'
import { CHAT_CHANNEL_COLORS } from '~/composables/useColorMap'

useHead({ title: 'Chat' })

const { rooms, isLoading, error, fetchRooms } = useChatRooms()

const ROOM_TYPE_CONFIG: Record<ChatRoomType, { label: string; icon: typeof Globe; iconBg: string; iconColor: string }> = {
  general: {
    label: 'General',
    icon: Globe,
    ...CHAT_CHANNEL_COLORS.general,
  },
  unit: {
    label: 'Mi Rancho',
    icon: Home,
    ...CHAT_CHANNEL_COLORS.unit,
  },
  vigilancia: {
    label: 'Vigilancia',
    icon: Shield,
    ...CHAT_CHANNEL_COLORS.vigilancia,
  },
  admin: {
    label: 'Admin',
    icon: Settings,
    ...CHAT_CHANNEL_COLORS.admin,
  },
}

const activeTab = ref<'canales' | 'mi-rancho'>('canales')

const channelRooms = computed(() =>
  rooms.value.filter(r => r.type !== 'unit'),
)

const unitRooms = computed(() =>
  rooms.value.filter(r => r.type === 'unit'),
)

const activeRooms = computed(() =>
  activeTab.value === 'canales' ? channelRooms.value : unitRooms.value,
)

onMounted(() => {
  fetchRooms()
})
</script>

<template>
  <div>
    <!-- Tabs -->
    <div class="mb-4 flex gap-2">
      <Button
        :variant="activeTab === 'canales' ? 'default' : 'outline'"
        size="sm"
        @click="activeTab = 'canales'"
      >
        Canales
      </Button>
      <Button
        :variant="activeTab === 'mi-rancho' ? 'default' : 'outline'"
        size="sm"
        @click="activeTab = 'mi-rancho'"
      >
        Mi Rancho
      </Button>
    </div>

    <!-- Error -->
    <ErrorAlert :message="error" class="mb-4" />

    <!-- Loading -->
    <div v-if="isLoading" class="divide-y rounded-lg border bg-card">
      <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-3 py-2.5">
        <Skeleton class="size-9 shrink-0 rounded-full" />
        <div class="flex-1 space-y-1.5">
          <Skeleton class="h-4 w-2/3" />
          <Skeleton class="h-3 w-1/3" />
        </div>
        <Skeleton class="size-4 shrink-0" />
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Empty state -->
      <EmptyState
        v-if="activeRooms.length === 0"
        :icon="MessageCircle"
        :title="activeTab === 'canales' ? 'No hay canales disponibles' : 'No hay chats de unidad'"
        :description="activeTab === 'canales' ? 'Los canales aparecerán aquí cuando estén habilitados' : 'Los chats de tu rancho aparecerán aquí'"
      />

      <!-- Room list -->
      <div v-else class="divide-y rounded-lg border bg-card">
        <NuxtLink
          v-for="room in activeRooms"
          :key="room.id"
          :to="`/mi-chana/chat/${room.id}`"
          class="flex items-center gap-3 px-3 py-2.5 transition-colors active:bg-muted/50"
        >
          <!-- Icon -->
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-full"
            :class="ROOM_TYPE_CONFIG[room.type].iconBg"
          >
            <component
              :is="ROOM_TYPE_CONFIG[room.type].icon"
              class="size-4"
              :class="ROOM_TYPE_CONFIG[room.type].iconColor"
            />
          </div>

          <!-- Info -->
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ room.name }}</p>
          </div>

          <!-- Chevron -->
          <ChevronRight class="size-4 shrink-0 text-muted-foreground/50" />
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
