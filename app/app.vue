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
// vue-sonner 2 no inyecta sus estilos: sin esta hoja los toasts quedan fuera de pantalla.
import 'vue-sonner/style.css'

const isDev = import.meta.dev
</script>
