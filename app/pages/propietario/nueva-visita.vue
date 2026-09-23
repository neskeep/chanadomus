<script setup lang="ts">
useHead({ title: 'Nueva Visita' })

const { user } = useAuth()
const unitId = computed(() => ((user.value as Record<string, unknown> | null)?.unitId as string | undefined) ?? null)
</script>

<template>
  <VisitPassCreator :unit-id="unitId" />
</template>
