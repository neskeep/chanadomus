<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  icon: Component
  title: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
    <div class="flex size-12 items-center justify-center rounded-lg bg-muted">
      <component :is="icon" class="size-6 text-muted-foreground" />
    </div>
    <div class="space-y-1">
      <p class="text-base font-semibold">{{ title }}</p>
      <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
    </div>
    <slot name="action" />
  </div>
</template>
