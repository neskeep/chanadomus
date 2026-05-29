<script setup lang="ts">
import type { Component } from 'vue'
import { Info, TrendingUp, TrendingDown } from 'lucide-vue-next'
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
  tooltip?: string
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
})
</script>

<template>
  <Card class="p-3 sm:p-4">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div class="flex size-7 shrink-0 items-center justify-center rounded-lg sm:order-2 sm:size-10" :class="iconBgClass">
        <component :is="icon" class="size-3.5 sm:size-5" />
      </div>
      <div class="flex min-w-0 flex-col gap-0.5 sm:order-1 sm:gap-1">
        <template v-if="isLoading">
          <Skeleton class="h-4 w-12 sm:h-5 sm:w-16" />
          <Skeleton class="h-6 w-10 sm:h-8 sm:w-24" />
        </template>
        <template v-else>
          <div class="flex items-center gap-1">
            <p class="text-[11px] leading-tight text-muted-foreground sm:text-sm">{{ label }}</p>
            <TooltipProvider v-if="tooltip" :delay-duration="200">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Info class="size-3 shrink-0 cursor-help text-muted-foreground/50 transition-colors hover:text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="top" class="max-w-56 text-xs">
                  {{ tooltip }}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p class="text-lg font-bold tabular-nums tracking-tight sm:text-2xl">{{ value }}</p>
        </template>
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
