<script setup lang="ts">
import type { Component } from 'vue'
import { TrendingUp, TrendingDown } from 'lucide-vue-next'
import { TREND_COLORS } from '~/composables/useColorMap'

interface TrendInfo {
  value: number
  label: string
}

interface Props {
  label: string
  value: string | number
  icon: Component
  iconBgClass: string
  trend?: TrendInfo
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
})
</script>

<template>
  <Card class="p-4">
    <div class="flex items-start justify-between gap-2">
      <div class="flex min-w-0 flex-col gap-1">
        <template v-if="isLoading">
          <Skeleton class="h-5 w-16" />
          <Skeleton class="h-8 w-24" />
        </template>
        <template v-else>
          <p class="text-xs text-muted-foreground md:text-sm">{{ label }}</p>
          <p class="truncate text-sm font-bold tabular-nums tracking-tight md:text-2xl">{{ value }}</p>
        </template>
      </div>
      <div class="flex size-8 shrink-0 items-center justify-center rounded-lg md:size-10" :class="iconBgClass">
        <component :is="icon" class="size-4 md:size-5" />
      </div>
    </div>
    <div v-if="trend && !isLoading" class="mt-2 flex items-center gap-1 text-xs">
      <TrendingUp v-if="trend.value >= 0" :class="TREND_COLORS.positive.icon" class="size-3" />
      <TrendingDown v-else :class="TREND_COLORS.negative.icon" class="size-3" />
      <span :class="trend.value >= 0 ? TREND_COLORS.positive.text : TREND_COLORS.negative.text">
        {{ trend.value >= 0 ? '+' : '' }}{{ trend.value }}%
      </span>
      <span class="text-muted-foreground">{{ trend.label }}</span>
    </div>
  </Card>
</template>
