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

definePageMeta({ layout: 'default', title: 'Chat' })

const { rooms, isLoading, error, fetchRooms } = useChatRooms()

const ROOM_TYPE_CONFIG: Record<ChatRoomType, { label: string; icon: typeof Globe; iconBg: string; iconColor: string }> = {
  general: {
    label: 'General',
    icon: Globe,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  unit: {
    label: 'Mi Rancho',
    icon: Home,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
  },
  vigilancia: {
    label: 'Vigilancia',
    icon: Shield,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
  },
  admin: {
    label: 'Admin',
    icon: Settings,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
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
  <div class="mx-auto max-w-lg">
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
    <div
      v-if="error"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="divide-y rounded-xl border bg-card">
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
      <div
        v-if="activeRooms.length === 0"
        class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
      >
        <div class="flex size-10 items-center justify-center rounded-lg bg-muted">
          <MessageCircle class="size-5 text-muted-foreground" />
        </div>
        <div>
          <p class="font-medium">
            {{ activeTab === 'canales' ? 'No hay canales disponibles' : 'No hay chats de unidad' }}
          </p>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ activeTab === 'canales' ? 'Los canales aparecerán aquí cuando estén habilitados' : 'Los chats de tu rancho aparecerán aquí' }}
          </p>
        </div>
      </div>

      <!-- Room list -->
      <div v-else class="divide-y rounded-xl border bg-card">
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
