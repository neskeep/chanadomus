<script setup lang="ts">
useHead({ title: 'Visitas del Rancho' })
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-10">
    <VisitPassList
      base-path="/conserje"
      empty-active-description="Crea un pase para un visitante del rancho."
    />
    <UnitAccessHistory subject="la vivienda" />
  </div>
</template>
