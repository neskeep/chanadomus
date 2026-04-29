<script setup lang="ts">
import { Search } from 'lucide-vue-next'

const model = defineModel<string>({ required: true })

defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <div class="flex h-8 items-center rounded-lg border bg-background">
    <Search class="ml-2.5 size-3.5 shrink-0 text-muted-foreground" />
    <input
      v-model="model"
      :placeholder="placeholder ?? 'Buscar...'"
      class="w-[130px] bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground lg:w-[180px]"
    />
    <slot />
  </div>
</template>
