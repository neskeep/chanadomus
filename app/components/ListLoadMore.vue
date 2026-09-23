<script setup lang="ts">
import { ChevronDown, Loader2 } from 'lucide-vue-next'

/**
 * Pie de lista paginada con "Cargar más": cuántos se ven de cuántos hay y el
 * botón para traer la siguiente página. No se muestra si ya está todo.
 */
interface Props {
  shown: number
  total: number
  hasMore: boolean
  isLoading?: boolean
  /** Sustantivo en plural para el contador, p. ej. "pases" */
  noun?: string
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  noun: 'resultados',
})

const emit = defineEmits<{
  load: []
}>()
</script>

<template>
  <div v-if="hasMore" class="flex flex-col items-center gap-2 pt-4">
    <p class="text-sm tabular-nums text-muted-foreground" aria-live="polite">
      Ves {{ shown }} de {{ total }} {{ noun }}
    </p>
    <Button
      variant="outline"
      class="h-11 w-full text-base sm:w-auto sm:min-w-56"
      :disabled="isLoading"
      @click="emit('load')"
    >
      <Loader2 v-if="isLoading" class="size-4 animate-spin" />
      <ChevronDown v-else class="size-4" />
      {{ isLoading ? 'Cargando...' : 'Cargar más' }}
    </Button>
  </div>
</template>
