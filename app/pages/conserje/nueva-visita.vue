<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

useHead({ title: 'Nueva Visita' })

const { unitId, fetchUnit, isLoading, error } = useConserjeUnit()

onMounted(fetchUnit)
</script>

<template>
  <div>
    <div v-if="isLoading || (!unitId && !error)" class="flex items-center justify-center py-12">
      <Loader2 class="size-6 animate-spin text-muted-foreground" />
    </div>
    <ErrorAlert v-else-if="error" :message="error" class="mb-4" />
    <VisitPassCreator v-else :unit-id="unitId" />
  </div>
</template>
