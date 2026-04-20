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

const ROOM_TYPE_CONFIG: Record<ChatRoomType, { label: string; icon: typeof Globe; badgeClass: string }> = {
  general: {
    label: 'General',
    icon: Globe,
    badgeClass: 'bg-primary/10 text-primary',
  },
  unit: {
    label: 'Mi Rancho',
    icon: Home,
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
  vigilancia: {
    label: 'Vigilancia',
    icon: Shield,
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  admin: {
    label: 'Admin',
    icon: Settings,
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
}

const TYPE_ORDER: ChatRoomType[] = ['general', 'unit', 'vigilancia', 'admin']

const groupedRooms = computed(() => {
  const groups: { type: ChatRoomType; label: string; items: typeof rooms.value }[] = []
  for (const type of TYPE_ORDER) {
    const items = rooms.value.filter(r => r.type === type)
    if (items.length > 0) {
      groups.push({ type, label: ROOM_TYPE_CONFIG[type].label, items })
    }
  }
  return groups
})

onMounted(() => {
  fetchRooms()
})
</script>

<template>
  <div class="mx-auto max-w-lg">
    <!-- Error -->
    <div
      v-if="error"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3">
      <Card v-for="i in 4" :key="i">
        <CardContent class="p-3">
          <div class="flex items-center gap-2.5">
            <Skeleton class="size-8 shrink-0 rounded-md" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-2/3" />
              <Skeleton class="h-5 w-16 rounded-full" />
            </div>
            <Skeleton class="size-4 shrink-0" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Empty state -->
      <div
        v-if="rooms.length === 0"
        class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
      >
        <div class="flex size-10 items-center justify-center rounded-lg bg-muted">
          <MessageCircle class="size-5 text-muted-foreground" />
        </div>
        <div>
          <p class="font-medium">No hay salas disponibles</p>
          <p class="mt-1 text-sm text-muted-foreground">Las salas de chat aparecerán aquí cuando estén habilitadas</p>
        </div>
      </div>

      <!-- Grouped rooms -->
      <div v-else class="space-y-6">
        <div v-for="group in groupedRooms" :key="group.type">
          <p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {{ group.label }}
          </p>
          <div class="space-y-2">
            <NuxtLink
              v-for="room in group.items"
              :key="room.id"
              :to="`/mi-chana/chat/${room.id}`"
              class="block"
            >
              <Card class="py-0 transition-shadow hover:shadow-md">
                <CardContent class="flex items-center gap-2.5 p-3">
                  <!-- Icon -->
                  <div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <component :is="ROOM_TYPE_CONFIG[room.type].icon" class="size-4 text-muted-foreground" />
                  </div>

                  <!-- Info -->
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">{{ room.name }}</p>
                    <span
                      class="mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
                      :class="ROOM_TYPE_CONFIG[room.type].badgeClass"
                    >
                      {{ ROOM_TYPE_CONFIG[room.type].label }}
                    </span>
                  </div>

                  <!-- Chevron -->
                  <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
