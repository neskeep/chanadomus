<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  label: string
  required?: boolean
  hint?: string
  icon?: Component
  error?: string
}

withDefaults(defineProps<Props>(), {
  required: false,
})
</script>

<template>
  <div class="space-y-1.5">
    <Label class="text-sm font-medium">
      {{ label }}
      <span v-if="required" class="text-destructive">*</span>
    </Label>
    <div class="relative">
      <div v-if="icon" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <component :is="icon" class="size-4" />
      </div>
      <div :class="icon ? '[&>*]:pl-10' : ''">
        <slot />
      </div>
    </div>
    <p v-if="error" class="text-xs text-destructive">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-muted-foreground">{{ hint }}</p>
  </div>
</template>
