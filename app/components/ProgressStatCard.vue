<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronRight, Info } from 'lucide-vue-next'

/**
 * Variante de StatCard con barra de progreso (0-100).
 * Opcional: texto de apoyo bajo la barra (`caption`). Con `to`, toda la tarjeta enlaza al detalle
 * (`linkLabel` es el texto accesible del enlace).
 */
interface Props {
  label: string
  value: string | number
  /** Porcentaje 0-100 que pinta la barra */
  progress: number
  icon: Component
  iconBgClass: string
  tooltip?: string
  caption?: string
  to?: string
  linkLabel?: string
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  linkLabel: 'Ver detalle',
})

const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to"
    class="group/link block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <Card class="h-full p-3 sm:p-4" :class="to && 'transition-colors group-hover/link:bg-muted/40'">
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

      <template v-if="!isLoading">
        <Progress :model-value="progress" :aria-label="label" class="mt-3 h-1.5" />
        <div v-if="caption || to" class="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground sm:text-xs">
          <span v-if="caption" class="min-w-0 truncate tabular-nums">{{ caption }}</span>
          <template v-if="to">
            <span class="sr-only">{{ linkLabel }}</span>
            <ChevronRight class="ml-auto size-3.5 shrink-0 transition-transform motion-reduce:transition-none group-hover/link:translate-x-0.5" aria-hidden="true" />
          </template>
        </div>
      </template>
      <Skeleton v-else class="mt-3 h-1.5 w-full rounded-lg" />
    </Card>
  </component>
</template>
