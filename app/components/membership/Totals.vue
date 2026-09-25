<script setup lang="ts">
import { CircleCheck, CircleDashed } from 'lucide-vue-next'
import {
  MEMBERSHIP_UNIT_KINDS,
  MEMBERSHIP_UNIT_KIND_LABELS,
  type MembershipRates,
  type MembershipTotals,
} from '~~/shared/types/membership'
import { ICON_BG } from '~/composables/useColorMap'

/**
 * Totales de la membresía: total del mes con su cálculo, unidades por tarifa y
 * desglose por tipo. Sirve para el mes en curso y para un cierre guardado.
 * El slot `note` va bajo el cálculo del total (p. ej. desde cuándo rige la tarifa).
 */
interface Props {
  totals: MembershipTotals | null
  rates: Pick<MembershipRates, 'fullRate' | 'reducedRate'> | null
  totalLabel?: string
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  totalLabel: 'Total del mes',
  isLoading: false,
})

const { formatCurrency } = useFormatDate()

function money(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : formatCurrency(value)
}

/** "$ 4,50 c/u, total $ 333,00"; sin tarifa, solo el número de unidades. */
function amountCaption(units: number, rate: number | undefined, value: number | null): string {
  if (rate === undefined || value === null) return units === 1 ? '1 unidad' : `${units} unidades`
  return `${formatCurrency(rate)} c/u, total ${formatCurrency(value)}`
}

function share(n: number): number {
  const total = props.totals?.totalUnits ?? 0
  return total > 0 ? (n / total) * 100 : 0
}

// "Otras" solo aparece si hay alguna (unidades sin prefijo R- ni P-).
const kindRows = computed(() => {
  if (!props.totals) return []
  const byKind = props.totals.byKind
  return MEMBERSHIP_UNIT_KINDS
    .filter(kind => kind !== 'otra' || byKind[kind].units > 0)
    .map(kind => ({ kind, label: MEMBERSHIP_UNIT_KIND_LABELS[kind], ...byKind[kind] }))
})
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <!-- Total: la cifra que se factura, con el cálculo que la produce -->
      <Card class="col-span-2 gap-0 p-4 sm:p-5">
        <template v-if="isLoading">
          <Skeleton class="h-5 w-28" />
          <Skeleton class="mt-2 h-9 w-40" />
          <Skeleton class="mt-3 h-4 w-56" />
        </template>
        <template v-else>
          <p class="text-sm text-muted-foreground">{{ totalLabel }}</p>
          <p class="mt-1 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">{{ money(totals?.total) }}</p>
          <p v-if="!rates" class="mt-2 text-sm text-muted-foreground">Sin tarifa configurada: solo se cuentan las unidades.</p>
          <slot name="note" />
        </template>
      </Card>

      <ProgressStatCard
        label="Tarifa completa"
        :value="totals?.byTier.full.units ?? '—'"
        :progress="share(totals?.byTier.full.units ?? 0)"
        :icon="CircleCheck"
        :icon-bg-class="ICON_BG.teal"
        :caption="totals ? amountCaption(totals.byTier.full.units, rates?.fullRate, totals.byTier.full.amount) : undefined"
        tooltip="Unidades con al menos un usuario o una persona o vehículo con QR permanente."
        :is-loading="isLoading"
      />
      <ProgressStatCard
        label="Tarifa reducida"
        :value="totals?.byTier.reduced.units ?? '—'"
        :progress="share(totals?.byTier.reduced.units ?? 0)"
        :icon="CircleDashed"
        :icon-bg-class="ICON_BG.orange"
        :caption="totals ? amountCaption(totals.byTier.reduced.units, rates?.reducedRate, totals.byTier.reduced.amount) : undefined"
        tooltip="Unidades sin ningún usuario y sin personas ni vehículos con QR permanente."
        :is-loading="isLoading"
      />
    </div>

    <!-- Desglose por tipo -->
    <Card class="gap-0 overflow-hidden p-0">
      <div v-if="isLoading" class="space-y-2 p-4">
        <Skeleton class="h-5 w-full" />
        <Skeleton class="h-5 w-full" />
      </div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead class="pl-4">Tipo</TableHead>
            <TableHead class="hidden text-right sm:table-cell">Unidades</TableHead>
            <TableHead class="text-right">Completa</TableHead>
            <TableHead class="text-right">Reducida</TableHead>
            <TableHead class="pr-4 text-right">Importe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in kindRows" :key="row.kind">
            <TableCell class="pl-4 font-medium">{{ row.label }}</TableCell>
            <TableCell class="hidden text-right tabular-nums sm:table-cell">{{ row.units }}</TableCell>
            <TableCell class="text-right tabular-nums text-muted-foreground">{{ row.byTier.full }}</TableCell>
            <TableCell class="text-right tabular-nums text-muted-foreground">{{ row.byTier.reduced }}</TableCell>
            <TableCell class="pr-4 text-right font-medium tabular-nums">{{ money(row.amount) }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  </div>
</template>
