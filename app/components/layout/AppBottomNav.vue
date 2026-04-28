<script setup lang="ts">
const { mobileItems } = useNavigation()
</script>

<template>
  <nav
    aria-label="Navegacion principal"
    class="fixed bottom-0 left-0 right-0 z-40 flex h-[4.5rem] items-center justify-around border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
  >
    <NuxtLink
      v-for="item in mobileItems"
      :key="item.to"
      :to="item.to"
      class="flex min-w-[3.5rem] flex-col items-center gap-1 py-2 text-muted-foreground transition-colors"
      active-class="!text-primary"
    >
      <component :is="item.icon" class="size-6" />
      <span class="text-xs font-medium">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>
