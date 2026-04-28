<script setup lang="ts">
interface Props {
  count?: number
  variant?: 'card' | 'row'
}

withDefaults(defineProps<Props>(), {
  count: 3,
  variant: 'card',
})
</script>

<template>
  <div v-if="variant === 'card'" class="space-y-3">
    <Card v-for="i in count" :key="i" class="p-4">
      <div class="flex items-start gap-3">
        <Skeleton class="size-10 rounded-lg shrink-0" />
        <div class="flex-1 space-y-2">
          <Skeleton class="h-4 w-3/4" />
          <Skeleton class="h-3 w-1/2" />
        </div>
      </div>
    </Card>
  </div>

  <div v-else class="space-y-2">
    <div v-for="i in count" :key="i" class="flex items-center gap-3 rounded-lg border p-3">
      <Skeleton class="size-8 rounded-full shrink-0" />
      <div class="flex-1 space-y-1.5">
        <Skeleton class="h-4 w-2/3" />
        <Skeleton class="h-3 w-1/3" />
      </div>
      <Skeleton class="h-6 w-16 rounded-full" />
    </div>
  </div>
</template>
