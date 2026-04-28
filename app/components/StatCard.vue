<script setup lang="ts">
import type { Component } from 'vue'
import { TrendingUp, TrendingDown } from 'lucide-vue-next'

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
    <div class="flex items-start justify-between">
      <div class="flex flex-col gap-1">
        <template v-if="isLoading">
          <Skeleton class="h-5 w-16" />
          <Skeleton class="h-8 w-24" />
        </template>
        <template v-else>
          <p class="text-sm text-muted-foreground">{{ label }}</p>
          <p class="text-2xl font-bold tracking-tight">{{ value }}</p>
        </template>
      </div>
      <div class="flex size-10 items-center justify-center rounded-lg" :class="iconBgClass">
        <component :is="icon" class="size-5" />
      </div>
    </div>
    <div v-if="trend && !isLoading" class="mt-2 flex items-center gap-1 text-xs">
      <TrendingUp v-if="trend.value >= 0" class="size-3 text-emerald-500" />
      <TrendingDown v-else class="size-3 text-red-500" />
      <span :class="trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'">
        {{ trend.value >= 0 ? '+' : '' }}{{ trend.value }}%
      </span>
      <span class="text-muted-foreground">{{ trend.label }}</span>
    </div>
  </Card>
</template>
