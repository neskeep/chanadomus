<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Sin conexión — ChanaDomus' })

function reload() {
  window.location.reload()
}
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center px-6">
    <div class="text-center space-y-4">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="2" x2="22" y1="2" y2="22" />
          <path d="M8.5 16.5a5 5 0 0 1 7 0" />
          <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
          <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
          <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
          <path d="M5 12.86a10 10 0 0 1 5.17-2.89" />
          <line x1="12" x2="12.01" y1="20" y2="20" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold tracking-tight">Sin conexión</h1>
      <p class="text-muted-foreground text-base max-w-xs mx-auto">
        No hay conexión a internet. Verifica tu red e intenta de nuevo.
      </p>
      <button
        class="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground"
        @click="reload"
      >
        Reintentar
      </button>
    </div>
  </div>
</template>
