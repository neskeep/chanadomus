<script setup lang="ts">
import { Search } from 'lucide-vue-next'

const model = defineModel<string>({ required: true })

defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <!-- El slot (normalmente TopbarFilters) va FUERA del campo para que el botón de filtros se vea como un control propio. -->
  <div class="flex w-full items-center gap-2 md:w-auto">
    <InputGroup class="h-11 min-w-0 flex-1 md:h-9 md:w-36 md:flex-none lg:w-60">
      <InputGroupAddon>
        <Search class="size-5 md:size-4" />
      </InputGroupAddon>
      <InputGroupInput
        v-model="model"
        type="search"
        :placeholder="placeholder ?? 'Buscar...'"
        :aria-label="placeholder ?? 'Buscar'"
        class="text-base md:text-sm"
      />
    </InputGroup>
    <slot />
  </div>
</template>
