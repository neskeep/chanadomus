<script setup lang="ts">
import { ROLE_LABELS } from '~~/shared/types/auth'
import type { PushStatsUser } from '~~/shared/types/push-stats'

/**
 * Lista de usuarios con su estado de notificaciones push.
 * Tabla en desktop, tarjetas compactas en móvil. Estados de carga/vacío los resuelve el padre.
 */
interface Props {
  users: readonly PushStatsUser[]
}

defineProps<Props>()

const { formatRelativeTime, formatDateTime } = useFormatDate()

function unitText(u: PushStatsUser): string {
  return u.unitLabel ?? u.unitNumber ?? '—'
}

function devicesText(devices: number): string {
  return devices === 1 ? '1 dispositivo' : `${devices} dispositivos`
}
</script>

<template>
  <div>
    <!-- Desktop -->
    <div class="hidden overflow-x-auto rounded-lg border md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead class="text-right">Dispositivos</TableHead>
            <TableHead>Última activación</TableHead>
            <TableHead>Chat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="u in users" :key="u.id">
            <TableCell class="max-w-64">
              <p class="truncate font-medium">{{ u.name }}</p>
              <p class="truncate text-xs text-muted-foreground">{{ u.email }}</p>
            </TableCell>
            <TableCell class="text-muted-foreground">{{ ROLE_LABELS[u.role] }}</TableCell>
            <TableCell class="tabular-nums text-muted-foreground">{{ unitText(u) }}</TableCell>
            <TableCell class="text-right tabular-nums" :class="u.devices === 0 && 'text-muted-foreground'">{{ u.devices }}</TableCell>
            <TableCell class="text-muted-foreground">
              <time v-if="u.lastSubscribedAt" :datetime="u.lastSubscribedAt" :title="formatDateTime(u.lastSubscribedAt)">
                {{ formatRelativeTime(u.lastSubscribedAt) }}
              </time>
              <span v-else>Nunca</span>
            </TableCell>
            <TableCell>
              <span v-if="u.devices === 0" class="text-muted-foreground">—</span>
              <span v-else-if="u.chatEnabled" class="text-muted-foreground">Activo</span>
              <Badge v-else variant="outline">Desactivado</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Móvil -->
    <ul class="space-y-2 md:hidden">
      <li v-for="u in users" :key="u.id">
        <Card class="px-3 py-2.5">
          <div class="flex items-center gap-1.5">
            <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ u.name }}</p>
            <Badge v-if="u.unitNumber || u.unitLabel" variant="outline" class="shrink-0 text-[11px] tabular-nums">
              {{ unitText(u) }}
            </Badge>
          </div>
          <div class="mt-0.5 flex flex-wrap items-center gap-x-1 text-[11px] text-muted-foreground">
            <span>{{ ROLE_LABELS[u.role] }}</span>
            <span class="opacity-30" aria-hidden="true">·</span>
            <template v-if="u.devices > 0">
              <span class="tabular-nums">{{ devicesText(u.devices) }}</span>
              <span class="opacity-30" aria-hidden="true">·</span>
              <time v-if="u.lastSubscribedAt" :datetime="u.lastSubscribedAt">{{ formatRelativeTime(u.lastSubscribedAt) }}</time>
              <template v-if="!u.chatEnabled">
                <span class="opacity-30" aria-hidden="true">·</span>
                <span class="font-medium text-foreground">Chat desactivado</span>
              </template>
            </template>
            <span v-else>Sin avisos activos</span>
          </div>
        </Card>
      </li>
    </ul>
  </div>
</template>
