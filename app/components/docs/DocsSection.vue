<script setup lang="ts">
interface Props {
  id: string
  title: string
}

defineProps<Props>()
</script>

<template>
  <section :id="id" :data-docs-section="id" class="scroll-mt-20">
    <h2 class="text-xl font-semibold tracking-tight">
      {{ title }}
    </h2>
    <Separator class="mt-2 mb-6" />
    <slot />
  </section>
</template>
