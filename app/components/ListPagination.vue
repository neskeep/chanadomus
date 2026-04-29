<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  currentPage: number
  totalPages: number
}

defineProps<Props>()

defineEmits<{
  'update:currentPage': [value: number]
}>()
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
    <Button variant="outline" size="default" :disabled="currentPage <= 1" @click="$emit('update:currentPage', currentPage - 1)">
      <ChevronLeft class="size-4 mr-1" /> Anterior
    </Button>
    <span class="text-sm text-muted-foreground">{{ currentPage }} de {{ totalPages }}</span>
    <Button variant="outline" size="default" :disabled="currentPage >= totalPages" @click="$emit('update:currentPage', currentPage + 1)">
      Siguiente <ChevronRight class="size-4 ml-1" />
    </Button>
  </div>
</template>
