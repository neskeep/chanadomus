<script setup lang="ts">
const pageInfo = usePageInfo()
</script>

<template>
  <header class="hidden md:flex shrink-0 py-4 items-center border-b bg-background px-4 lg:px-6">
    <div class="min-w-0 shrink-0">
      <h1 class="text-base font-semibold truncate leading-tight">{{ pageInfo.title }}</h1>
      <p v-if="pageInfo.description" class="text-xs text-muted-foreground truncate">{{ pageInfo.description }}</p>
    </div>

    <div id="topbar-actions" class="ml-auto flex items-center gap-2" />
  </header>
</template>
