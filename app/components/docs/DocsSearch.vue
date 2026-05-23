<script setup lang="ts">
const { query, results, isOpen, selectResult } = useDocsSearch()
</script>

<template>
  <CommandDialog
    v-model:open="isOpen"
    title="Buscar en documentación"
    description="Busca secciones del manual por título o palabra clave"
  >
    <CommandInput v-model="query" placeholder="Buscar en la documentación..." />
    <CommandList>
      <CommandEmpty>No se encontraron resultados</CommandEmpty>
      <CommandGroup v-if="results.length > 0" heading="Resultados">
        <CommandItem
          v-for="result in results"
          :key="result.id"
          :value="result.id"
          @select="selectResult(result.id)"
        >
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted-foreground">{{ result.group }}</span>
            <span class="text-sm">{{ result.title }}</span>
          </div>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
