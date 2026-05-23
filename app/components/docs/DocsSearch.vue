<script setup lang="ts">
import { SearchIcon } from 'lucide-vue-next'

const { query, results, isOpen, closeSearch, selectResult } = useDocsSearch()

const inputRef = ref<HTMLInputElement>()

function handleOpenChange(open: boolean) {
  isOpen.value = open
  if (open) {
    nextTick(() => inputRef.value?.focus())
  }
  else {
    query.value = ''
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent
      class="rounded-4xl! top-1/3 translate-y-0 overflow-hidden p-0 sm:max-w-md"
      :show-close-button="false"
    >
      <DialogHeader class="sr-only">
        <DialogTitle>Buscar en documentación</DialogTitle>
        <DialogDescription>Busca secciones del manual por título o palabra clave</DialogDescription>
      </DialogHeader>

      <!-- Search input -->
      <div class="p-1 pb-0">
        <InputGroup class="bg-input/50 h-9">
          <input
            ref="inputRef"
            v-model="query"
            data-slot="input-group-control"
            class="w-full bg-transparent px-3 text-sm outline-hidden placeholder:text-muted-foreground"
            placeholder="Buscar en la documentación..."
          >
          <InputGroupAddon>
            <SearchIcon class="size-4 shrink-0 opacity-50" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <!-- Results -->
      <div class="max-h-72 overflow-y-auto p-1.5">
        <p
          v-if="query && results.length === 0"
          class="py-6 text-center text-sm text-muted-foreground"
        >
          No se encontraron resultados
        </p>

        <template v-if="results.length > 0">
          <button
            v-for="result in results"
            :key="result.id"
            class="flex w-full cursor-default items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-medium outline-hidden hover:bg-muted focus-visible:bg-muted"
            @click="selectResult(result.id)"
          >
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-muted-foreground">{{ result.group }}</span>
              <span class="text-sm">{{ result.title }}</span>
            </div>
          </button>
        </template>
      </div>
    </DialogContent>
  </Dialog>
</template>
