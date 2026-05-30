<script setup lang="ts">
import { FileTextIcon, SearchIcon } from 'lucide-vue-next'

const { query, results, isOpen, selectResult } = useDocsSearch()

const inputRef = ref<HTMLInputElement>()

const groupedResults = computed(() => {
  const groups = new Map<string, typeof results.value>()
  for (const result of results.value) {
    const existing = groups.get(result.group) ?? []
    existing.push(result)
    groups.set(result.group, existing)
  }
  return groups
})

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
      class="rounded-4xl! top-1/3 translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-md"
      :show-close-button="false"
    >
      <DialogHeader class="sr-only">
        <DialogTitle>Buscar en documentación</DialogTitle>
        <DialogDescription>Busca secciones del manual por título o palabra clave</DialogDescription>
      </DialogHeader>

      <!-- Search input -->
      <div class="border-b p-2">
        <InputGroup class="bg-input/50 h-9">
          <InputGroupAddon align="inline-start">
            <SearchIcon class="size-4 shrink-0 opacity-50" />
          </InputGroupAddon>
          <input
            ref="inputRef"
            v-model="query"
            data-slot="input-group-control"
            class="w-full bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
            placeholder="Buscar sección..."
          >
        </InputGroup>
      </div>

      <!-- Results -->
      <div class="max-h-72 overflow-y-auto">
        <p
          v-if="query && results.length === 0"
          class="py-8 text-center text-sm text-muted-foreground"
        >
          No se encontraron resultados
        </p>

        <div v-if="results.length > 0" class="p-1.5">
          <template v-for="[group, items] in groupedResults" :key="group">
            <p class="mt-2 mb-1 px-3 text-xs font-medium text-muted-foreground first:mt-0">
              {{ group }}
            </p>
            <button
              v-for="item in items"
              :key="item.id"
              class="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-sm outline-hidden transition-colors hover:bg-muted focus-visible:bg-muted"
              @click="selectResult(item.id)"
            >
              <FileTextIcon class="size-4 shrink-0 text-muted-foreground" />
              <span class="font-medium">{{ item.title }}</span>
            </button>
          </template>
        </div>

        <p
          v-if="!query"
          class="py-8 text-center text-sm text-muted-foreground"
        >
          Escribe para buscar en el manual
        </p>
      </div>
    </DialogContent>
  </Dialog>
</template>
