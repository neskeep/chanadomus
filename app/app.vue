<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <Sonner />
    <DevRoleSwitcher v-if="isDev" />
  </ClientOnly>
</template>

<script setup lang="ts">
const isDev = import.meta.dev
</script>
