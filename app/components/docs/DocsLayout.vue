<script setup lang="ts">
import { ListIcon } from 'lucide-vue-next'

const { initObserver, destroyObserver } = useDocsNavigation()
const tocOpen = ref(false)

onMounted(() => {
  initObserver()
})

onUnmounted(() => {
  destroyObserver()
})
</script>

<template>
  <div class="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
    <!-- Desktop sidebar -->
    <aside class="hidden lg:block">
      <div class="sticky top-16">
        <ScrollArea class="h-[calc(100vh-5rem)] pr-2">
          <DocsToc class="pb-8" />
        </ScrollArea>
      </div>
    </aside>

    <!-- Main content -->
    <main class="min-w-0 space-y-12">
      <slot />
    </main>

    <!-- Mobile FAB -->
    <Button
      variant="secondary"
      size="icon"
      class="fixed bottom-20 right-4 z-40 shadow-lg lg:hidden"
      aria-label="Abrir índice de contenido"
      @click="tocOpen = true"
    >
      <ListIcon class="size-5" />
    </Button>

    <!-- Mobile TOC sheet -->
    <DocsTocMobile v-model="tocOpen" />

    <!-- Search dialog -->
    <DocsSearch />
  </div>
</template>
