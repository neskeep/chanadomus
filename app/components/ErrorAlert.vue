<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'

interface Props {
  message: string | null | undefined
}

defineProps<Props>()
</script>

<template>
  <div v-if="message" class="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
    <AlertCircle class="size-5 shrink-0" />
    <p>{{ message }}</p>
  </div>
</template>
