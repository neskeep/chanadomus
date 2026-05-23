<script setup lang="ts">
interface Props {
  steps: string[]
}

defineProps<Props>()
</script>

<template>
  <ol class="space-y-3">
    <li
      v-for="(step, index) in steps"
      :key="index"
      class="flex items-start gap-3"
    >
      <div class="flex shrink-0 items-center justify-center size-6 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
        {{ index + 1 }}
      </div>
      <p class="text-sm leading-relaxed pt-0.5">
        {{ step }}
      </p>
    </li>
  </ol>
</template>
