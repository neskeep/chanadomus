<script setup lang="ts">
import { Search } from 'lucide-vue-next'

const model = defineModel<string>({ required: true })

defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <div class="relative">
    <Search class="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    <Input
      v-model="model"
      :placeholder="placeholder ?? 'Buscar...'"
      class="h-8 w-[180px] pl-8 text-sm lg:w-[220px]"
    />
  </div>
</template>
