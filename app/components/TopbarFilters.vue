<script setup lang="ts">
import { SlidersHorizontal } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  active?: boolean
  /**
   * Número de filtros aplicados. Si se omite, se asume 1 cuando `active` es true
   * (correcto para pantallas con un solo filtro).
   */
  count?: number
  /** `wide` da más ancho al popover, p. ej. para filtros en modo lista con nombres largos. */
  size?: 'default' | 'wide'
}>(), {
  active: false,
  count: undefined,
  size: 'default',
})

const WIDTH_CLASSES = {
  default: 'w-64',
  wide: 'w-80',
} as const

const emit = defineEmits<{
  clear: []
}>()

const activeCount = computed(() => props.count ?? (props.active ? 1 : 0))

const triggerLabel = computed(() => {
  const n = activeCount.value
  if (n === 0) return 'Filtros'
  return `Filtros, ${n} ${n === 1 ? 'activo' : 'activos'}`
})
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :aria-label="triggerLabel"
        class="h-11 shrink-0 gap-2 px-4 text-base md:h-9 md:px-3 md:text-sm"
        :class="activeCount > 0 && 'border-primary text-foreground'"
      >
        <SlidersHorizontal class="size-5 md:size-4" />
        <span>Filtros</span>
        <Badge
          v-if="activeCount > 0"
          aria-hidden="true"
          class="h-6 min-w-6 bg-foreground px-1.5 text-sm text-background tabular-nums md:h-5 md:min-w-5 md:text-xs"
        >
          {{ activeCount }}
        </Badge>
      </Button>
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
      <div class="max-h-[min(60vh,400px)] space-y-3 overflow-y-auto p-3">
        <slot />
      </div>
      <div v-if="activeCount > 0" class="border-t border-border p-1.5">
        <Button
          variant="ghost"
          class="h-11 w-full text-sm text-muted-foreground md:h-9"
          @click="emit('clear')"
        >
          Limpiar filtros
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</template>
