<script setup lang="ts">
import { MEMBERSHIP_UNIT_KIND_LABELS } from '~~/shared/types/membership'
import type { MembershipTableRow } from '~/composables/useMembership'

/**
 * Unidades con su tarifa. Sirve para el mes en curso y para un cierre guardado.
 * Tabla en desktop y lista compacta en móvil. Las columnas de contexto (accesos,
 * movimientos y saldo) solo aparecen con `showContext` y si la fila las trae.
 * Carga, vacío y error los resuelve el padre.
 */
interface Props {
  rows: readonly MembershipTableRow[]
  showContext?: boolean
}

withDefaults(defineProps<Props>(), { showContext: false })

const { formatCurrency } = useFormatDate()

function amount(rate: number | null): string {
  return rate === null ? '—' : formatCurrency(rate)
}

function balanceClass(balance: number): string {
  return balance < 0 ? 'text-destructive' : 'text-muted-foreground'
}
</script>

<template>
  <div>
    <!-- Desktop -->
    <div class="hidden overflow-x-auto rounded-lg border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unidad</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Tarifa</TableHead>
            <TableHead class="text-right">Importe</TableHead>
            <TableHead>Motivo</TableHead>
            <template v-if="showContext">
              <TableHead class="text-right">Accesos 30 días</TableHead>
              <TableHead class="text-right">Movimientos</TableHead>
              <TableHead class="text-right">Saldo</TableHead>
            </template>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in rows" :key="row.id">
            <TableCell class="max-w-56">
              <p class="font-medium tabular-nums">{{ row.number }}</p>
              <p v-if="row.label && row.label !== row.number" class="truncate text-xs text-muted-foreground">{{ row.label }}</p>
            </TableCell>
            <TableCell class="text-muted-foreground">{{ MEMBERSHIP_UNIT_KIND_LABELS[row.kind] }}</TableCell>
            <TableCell :class="row.isActive ? 'text-muted-foreground' : 'font-medium text-foreground'">
              {{ row.isActive ? 'Activa' : 'Inactiva' }}
            </TableCell>
            <TableCell><MembershipTierBadge :tier="row.tier" short /></TableCell>
            <TableCell class="text-right font-medium tabular-nums">{{ amount(row.rate) }}</TableCell>
            <TableCell class="max-w-72 whitespace-normal text-sm text-muted-foreground">{{ row.reasons }}</TableCell>
            <template v-if="showContext">
              <TableCell class="text-right tabular-nums text-muted-foreground">{{ row.context?.accesses30d ?? '—' }}</TableCell>
              <TableCell class="text-right tabular-nums text-muted-foreground">{{ row.context?.financialMovements ?? '—' }}</TableCell>
              <TableCell class="text-right tabular-nums" :class="row.context ? balanceClass(row.context.balance) : 'text-muted-foreground'">
                {{ row.context ? formatCurrency(row.context.balance) : '—' }}
              </TableCell>
            </template>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Móvil -->
    <ul class="space-y-2 md:hidden">
      <li v-for="row in rows" :key="row.id">
        <Card class="gap-0 px-3 py-2.5">
          <div class="flex items-center gap-2">
            <p class="min-w-0 flex-1 truncate text-sm font-semibold">
              <span class="tabular-nums">{{ row.number }}</span>
              <span v-if="row.label && row.label !== row.number" class="ms-1.5 font-normal text-muted-foreground">{{ row.label }}</span>
            </p>
            <span class="shrink-0 text-sm font-semibold tabular-nums">{{ amount(row.rate) }}</span>
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
            <MembershipTierBadge :tier="row.tier" short />
            <span>{{ MEMBERSHIP_UNIT_KIND_LABELS[row.kind] }}</span>
            <template v-if="!row.isActive">
              <span class="opacity-30" aria-hidden="true">·</span>
              <span class="font-medium text-foreground">Inactiva</span>
            </template>
          </div>
          <p class="mt-1 text-xs text-muted-foreground">{{ row.reasons }}</p>
          <dl v-if="showContext && row.context" class="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
            <div class="flex gap-1">
              <dt>Accesos 30 días</dt>
              <dd class="font-medium tabular-nums text-foreground">{{ row.context.accesses30d }}</dd>
            </div>
            <div class="flex gap-1">
              <dt>Movimientos</dt>
              <dd class="font-medium tabular-nums text-foreground">{{ row.context.financialMovements }}</dd>
            </div>
            <div class="flex gap-1">
              <dt>Saldo</dt>
              <dd class="font-medium tabular-nums" :class="row.context.balance < 0 ? 'text-destructive' : 'text-foreground'">
                {{ formatCurrency(row.context.balance) }}
              </dd>
            </div>
          </dl>
        </Card>
      </li>
    </ul>
  </div>
</template>
