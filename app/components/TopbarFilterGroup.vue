<script setup lang="ts">
const model = defineModel<string>({ required: true })

defineProps<{
  label: string
  options: { value: string; label: string }[]
}>()
</script>

<template>
  <div>
    <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{{ label }}</p>
    <div class="flex flex-wrap gap-1">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="rounded-lg px-2 py-1 text-xs font-medium transition-colors"
        :class="model === opt.value
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:text-foreground'"
        @click="model = model === opt.value ? '' : opt.value"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>
