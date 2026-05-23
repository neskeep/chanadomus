<script setup lang="ts">
import { Info, AlertTriangle, AlertCircle } from 'lucide-vue-next'

interface Props {
  variant?: 'info' | 'warning' | 'danger'
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  title: undefined,
})

const variantConfig = {
  info: {
    icon: Info,
    classes: 'border-l-primary bg-primary/5',
    iconClass: 'text-primary',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'border-l-[oklch(0.75_0.18_70)] bg-[oklch(0.75_0.18_70)]/5',
    iconClass: 'text-[oklch(0.75_0.18_70)]',
  },
  danger: {
    icon: AlertCircle,
    classes: 'border-l-destructive bg-destructive/5',
    iconClass: 'text-destructive',
  },
} as const

const config = computed(() => variantConfig[props.variant])
</script>

<template>
  <Card class="border-l-4 rounded-lg" :class="config.classes">
    <CardContent class="flex gap-3 p-4">
      <component
        :is="config.icon"
        :class="config.iconClass"
        class="size-5 shrink-0 mt-0.5"
      />
      <div class="space-y-1">
        <p v-if="title" class="font-medium text-sm">
          {{ title }}
        </p>
        <div class="text-sm text-muted-foreground">
          <slot />
        </div>
      </div>
    </CardContent>
  </Card>
</template>
