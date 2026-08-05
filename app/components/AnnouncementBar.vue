<script setup lang="ts">
import { X, Megaphone } from 'lucide-vue-next'

const dismissed = ref<string | null>(null)

const { data } = useLazyFetch('/api/push/broadcast/latest', {
  default: () => ({ data: null }),
})

const broadcast = computed(() => data.value?.data)

onMounted(() => {
  dismissed.value = localStorage.getItem('dismissed-broadcast')
})

const isVisible = computed(() => {
  if (!broadcast.value) return false
  return dismissed.value !== broadcast.value.id
})

function dismiss() {
  if (broadcast.value) {
    dismissed.value = broadcast.value.id
    localStorage.setItem('dismissed-broadcast', broadcast.value.id)
  }
}
</script>

<template>
  <div
    v-if="isVisible"
    class="flex items-center gap-2 border-b bg-primary/5 px-4 py-2 text-sm"
  >
    <Megaphone class="size-4 shrink-0 text-primary" />
    <span class="font-medium text-primary">{{ broadcast!.title }}</span>
    <span class="text-muted-foreground hidden sm:inline">—</span>
    <span class="text-muted-foreground truncate hidden sm:inline">{{ broadcast!.body }}</span>
    <button
      class="ml-auto shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
      @click="dismiss"
    >
      <X class="size-3.5" />
    </button>
  </div>
</template>
