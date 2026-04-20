<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  size?: 'default' | 'sm'
}>(), {
  size: 'default',
})
</script>

<template>
  <div
    data-slot="card"
    :data-size="size"
    :class="cn('bg-card text-card-foreground ring-foreground/5 dark:ring-foreground/10 overflow-hidden rounded-xl text-sm shadow-sm ring-1 has-[>img:first-child]:pt-0 group/card flex flex-col', props.class)"
  >
    <slot />
  </div>
</template>
