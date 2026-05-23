<script setup lang="ts">
interface Props {
  id: string
  title: string
}

defineProps<Props>()
</script>

<template>
  <div :id="id" class="scroll-mt-20 mt-8">
    <h3 class="text-lg font-semibold">
      {{ title }}
    </h3>
    <div class="mt-3">
      <slot />
    </div>
  </div>
</template>
