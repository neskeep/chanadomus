<script setup lang="ts">
import { ROLE_LABELS } from '~~/shared/types/auth'
import type { PushStatsRoleRow } from '~~/shared/types/push-stats'

/** Desglose por rol del alcance de notificaciones push (solo presentación). */
interface Props {
  rows: readonly PushStatsRoleRow[]
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
})

function percentage(row: PushStatsRoleRow): string {
  if (row.users === 0) return '—'
  return `${((row.withPush / row.users) * 100).toFixed(0)}%`
}
</script>

<template>
  <div>
    <!-- Móvil: una fila compacta por rol -->
    <ul class="space-y-2 md:hidden">
      <template v-if="isLoading">
        <li v-for="i in 4" :key="i"><Skeleton class="h-14 w-full rounded-lg" /></li>
      </template>
      <template v-else>
        <li v-for="row in rows" :key="row.role">
          <Card class="px-3 py-2.5">
            <div class="flex items-center gap-1.5">
              <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ ROLE_LABELS[row.role] }}</p>
              <span class="shrink-0 text-sm tabular-nums">{{ row.withPush }} de {{ row.users }}</span>
              <span class="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{{ percentage(row) }}</span>
            </div>
            <div class="mt-0.5 flex flex-wrap items-center gap-x-1 text-[11px] text-muted-foreground">
              <span class="tabular-nums">{{ row.devices }} {{ row.devices === 1 ? 'dispositivo' : 'dispositivos' }}</span>
              <template v-if="row.chatDisabled > 0">
                <span class="opacity-30" aria-hidden="true">·</span>
                <span class="font-medium tabular-nums text-foreground">{{ row.chatDisabled }} con chat desactivado</span>
              </template>
            </div>
          </Card>
        </li>
      </template>
    </ul>

    <div class="hidden overflow-x-auto rounded-lg border md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rol</TableHead>
            <TableHead class="text-right">Usuarios</TableHead>
            <TableHead class="text-right">Con avisos</TableHead>
            <TableHead class="text-right">%</TableHead>
            <TableHead class="text-right">Chat desactivado</TableHead>
            <TableHead class="text-right">Dispositivos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="isLoading">
            <TableRow v-for="i in 4" :key="i">
              <TableCell><Skeleton class="h-4 w-24" /></TableCell>
              <TableCell v-for="c in 5" :key="c"><Skeleton class="ml-auto h-4 w-8" /></TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow v-for="row in rows" :key="row.role">
              <TableCell class="font-medium">{{ ROLE_LABELS[row.role] }}</TableCell>
              <TableCell class="text-right tabular-nums">{{ row.users }}</TableCell>
              <TableCell class="text-right tabular-nums">{{ row.withPush }}</TableCell>
              <TableCell class="text-right tabular-nums text-muted-foreground">{{ percentage(row) }}</TableCell>
              <TableCell class="text-right tabular-nums" :class="row.chatDisabled > 0 ? 'font-medium' : 'text-muted-foreground'">
                {{ row.chatDisabled }}
              </TableCell>
              <TableCell class="text-right tabular-nums text-muted-foreground">{{ row.devices }}</TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
