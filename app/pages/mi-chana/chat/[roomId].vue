<script setup lang="ts">
import { Wifi, WifiOff } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const { target, isMounted } = useTopbarPortal()
const route = useRoute()

const roomId = computed(() => route.params.roomId as string)
const { rooms, fetchRooms } = useChatRooms()
const conversationConnected = ref(false)

const roomName = computed(() => {
  const room = rooms.value.find(r => r.id === roomId.value)
  return room?.name ?? 'Chat'
})

// Breadcrumb navigation
const chatPageOverride = computed(() => ({
  title: roomName.value,
  breadcrumbs: [{ label: 'Chat', to: '/mi-chana/chat' }],
}))
usePageInfoOverride(chatPageOverride)

function handleConnectionChange(connected: boolean) {
  conversationConnected.value = connected
}

onMounted(() => {
  fetchRooms()
})
</script>

<template>
  <div class="absolute inset-0 flex flex-col pb-[4.5rem] md:pb-0">
    <!-- Topbar connection status -->
    <Teleport :to="target" defer v-if="isMounted">
      <div class="flex items-center gap-1.5 text-xs">
        <component
          :is="conversationConnected ? Wifi : WifiOff"
          class="size-3.5"
          :class="conversationConnected ? 'text-primary' : 'text-destructive'"
        />
        <span :class="conversationConnected ? 'text-primary' : 'text-destructive'">
          {{ conversationConnected ? 'Conectado' : 'Desconectado' }}
        </span>
      </div>
    </Teleport>

    <!-- Conversation -->
    <ChatConversation
      :room-id="roomId"
      :room-name="roomName"
      class="flex-1"
      @connection-change="handleConnectionChange"
    />
  </div>
</template>
