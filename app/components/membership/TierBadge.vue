<script setup lang="ts">
import { MEMBERSHIP_TIER_LABELS, type MembershipTier } from '~~/shared/types/membership'

/**
 * Tarifa de una unidad. El color va en el punto (primary = completa, secondary = reducida)
 * y el texto queda en foreground para mantener el contraste.
 */
interface Props {
  tier: MembershipTier
  /** `short` muestra "Completa" / "Reducida" (listas compactas) */
  short?: boolean
}

const props = withDefaults(defineProps<Props>(), { short: false })

const DOT_CLASS: Record<MembershipTier, string> = {
  full: 'bg-primary',
  reduced: 'bg-secondary',
}

const SHORT_LABELS: Record<MembershipTier, string> = {
  full: 'Completa',
  reduced: 'Reducida',
}

const label = computed(() => (props.short ? SHORT_LABELS[props.tier] : MEMBERSHIP_TIER_LABELS[props.tier]))
</script>

<template>
  <Badge variant="outline" class="gap-1.5 font-medium">
    <span class="size-1.5 rounded-lg" :class="DOT_CLASS[tier]" aria-hidden="true" />
    {{ label }}
  </Badge>
</template>
