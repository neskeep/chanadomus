<script setup lang="ts">
import { SlidersHorizontal } from 'lucide-vue-next'

withDefaults(defineProps<{
  active?: boolean
  /** `wide` da más ancho al popover, p. ej. para filtros en modo lista con nombres largos. */
  size?: 'default' | 'wide'
}>(), {
  active: false,
  size: 'default',
})

const WIDTH_CLASSES = {
  default: 'w-56',
  wide: 'w-72',
} as const

const emit = defineEmits<{
  clear: []
}>()
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <button
        type="button"
        aria-label="Filtros"
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
      class="max-w-[calc(100vw-2rem)] gap-0 p-0"
      :class="WIDTH_CLASSES[size]"
      @interact-outside="(e: Event) => {
        const target = e.target as HTMLElement | null
        if (target?.closest('[data-unit-search]') || target?.closest('[data-unit-combobox-dropdown]')) {
          e.preventDefault()
        }
      }"
    >
      <div class="max-h-[min(60vh,400px)] space-y-3 overflow-y-auto p-2.5">
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
