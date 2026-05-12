<script setup lang="ts">
import { SlidersHorizontal, X } from 'lucide-vue-next'

const props = defineProps<{
  active?: boolean
}>()

const emit = defineEmits<{
  clear: []
}>()
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <button
        class="relative flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <SlidersHorizontal class="size-3.5" />
        <span
          v-if="active"
          class="absolute -right-0.5 -top-0.5 size-2 rounded-lg bg-primary"
        />
      </button>
    </PopoverTrigger>
    <PopoverContent
      align="end"
      :side-offset="8"
      class="w-56 p-0"
    >
      <div class="space-y-3 p-2.5">
        <slot />
      </div>
      <button
        v-if="active"
        class="w-full border-t border-border px-2.5 py-2 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
        @click="emit('clear')"
      >
        Limpiar filtros
      </button>
    </PopoverContent>
  </Popover>
</template>
