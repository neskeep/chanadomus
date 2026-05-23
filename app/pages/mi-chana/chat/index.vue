<script setup lang="ts">
import { MessageCircle } from 'lucide-vue-next'

useHead({ title: 'Chat' })
</script>

<template>
  <!-- Desktop empty state: shown when no room is selected -->
  <div class="hidden h-full flex-col items-center justify-center gap-3 text-center md:flex">
    <div class="flex size-16 items-center justify-center rounded-lg bg-muted">
      <MessageCircle class="size-7 text-muted-foreground" />
    </div>
    <div>
      <p class="text-sm font-medium text-muted-foreground">Selecciona una conversación</p>
      <p class="mt-0.5 text-xs text-muted-foreground/60">Elige un grupo o conversación para comenzar</p>
    </div>
  </div>
</template>
