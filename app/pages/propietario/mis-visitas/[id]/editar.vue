<script setup lang="ts">
useHead({ title: 'Editar visita' })

const route = useRoute()
const passId = computed(() => String(route.params.id))
</script>

<template>
  <VisitPassEditor :key="passId" :pass-id="passId" list-path="/propietario/mis-visitas" new-pass-path="/propietario/nueva-visita" />
</template>
