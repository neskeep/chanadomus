<script setup lang="ts">
const isOpen = defineModel<boolean>({ default: false })
const { groups, activeId, scrollTo } = useDocsNavigation()

function handleSelect(id: string) {
  scrollTo(id)
  isOpen.value = false
}
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent side="bottom" class="rounded-t-lg">
      <SheetHeader class="pb-4">
        <SheetTitle>Índice</SheetTitle>
        <SheetDescription>Navega por las secciones del manual</SheetDescription>
      </SheetHeader>

      <ScrollArea class="h-[60vh]">
        <nav aria-label="Índice de documentación mobile" class="space-y-1 pb-4">
          <div v-for="group in groups" :key="group.label">
            <div class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {{ group.label }}
            </div>
            <div class="space-y-0.5">
              <SheetClose as-child>
                <button
                  v-for="item in group.items"
                  :key="item.id"
                  class="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  :class="activeId === item.id ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground'"
                  @click="handleSelect(item.id)"
                >
                  {{ item.label }}
                </button>
              </SheetClose>
            </div>
          </div>
        </nav>
      </ScrollArea>
    </SheetContent>
  </Sheet>
</template>
