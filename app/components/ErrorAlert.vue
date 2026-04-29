<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'

interface Props {
  message: string | null | undefined
}

defineProps<Props>()
</script>

<template>
  <div v-if="message" class="flex items-center gap-2.5 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
    <AlertCircle class="size-4 shrink-0" />
    <p>{{ message }}</p>
  </div>
</template>
