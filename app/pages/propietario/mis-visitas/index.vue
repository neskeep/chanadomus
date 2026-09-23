<script setup lang="ts">
useHead({ title: 'Mis Visitas' })
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-10">
    <VisitPassList base-path="/propietario" />
    <UnitAccessHistory subject="tu vivienda" />
  </div>
</template>
