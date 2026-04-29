<script setup lang="ts">
import { Shield, CheckCircle2, XCircle, AlertTriangle, QrCode, UserPlus, Wifi, LogOut } from 'lucide-vue-next'
import type { AccessResult, EntryType } from '~~/shared/types/access'

useHead({ title: 'Registro de Accesos' })

const { target, isMounted } = useTopbarPortal()
const { events, isConnected, loadInitialEvents, markExit } = useAccessStream()
const exitingId = ref<string | null>(null)

async function handleMarkExit(id: string) {
  exitingId.value = id
  try {
    await markExit(id)
  }
  finally {
    exitingId.value = null
  }
}

onMounted(async () => {
  await loadInitialEvents()
})

const RESULT_CONFIG: Record<AccessResult, {
  label: string
  textClass: string
  dotClass: string
}> = {
  allowed: {
    label: 'Permitido',
    textClass: 'text-primary',
    dotClass: 'bg-primary',
  },
  denied: {
    label: 'Denegado',
    textClass: 'text-destructive',
    dotClass: 'bg-destructive',
  },
  expired: {
    label: 'Expirado',
    textClass: 'text-amber-600',
    dotClass: 'bg-amber-500',
  },
  already_used: {
    label: 'Ya usado',
    textClass: 'text-amber-600',
    dotClass: 'bg-amber-500',
  },
}

const ENTRY_TYPE_CONFIG: Record<EntryType, { label: string; icon: typeof QrCode }> = {
  qr: { label: 'QR', icon: QrCode },
  manual: { label: 'Manual', icon: UserPlus },
  webhook: { label: 'Dispositivo', icon: Wifi },
}

const clientNow = ref<number>(0)
let tickInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  clientNow.value = Date.now()
  tickInterval = setInterval(() => { clientNow.value = Date.now() }, 30000)
})

onBeforeUnmount(() => {
  if (tickInterval) clearInterval(tickInterval)
})

function formatRelativeTime(dateStr: string): string {
  if (!clientNow.value) return ''
  const diffMs = clientNow.value - new Date(dateStr).getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 30) return 'ahora'
  if (diffSec < 60) return `${diffSec}s`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr}h`
}

function formatAbsoluteTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDuration(entryDate: string, exitDate: string): string {
  const diffMs = new Date(exitDate).getTime() - new Date(entryDate).getTime()
  const diffMin = Math.max(0, Math.floor(diffMs / 60000))
  if (diffMin < 60) return `${diffMin}m`
  const hours = Math.floor(diffMin / 60)
  const mins = diffMin % 60
  return `${hours}h ${mins}m`
}
</script>

<template>
  <div>
    <!-- Topbar: connection status -->
    <Teleport v-if="isMounted" :to="target" defer>
      <Badge
        variant="outline"
        :class="isConnected ? 'border-primary text-primary' : 'border-destructive text-destructive'"
        class="gap-1.5"
      >
        <span class="relative flex size-2">
          <span
            v-if="isConnected"
            class="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75"
          />
          <span
            class="relative inline-flex size-2 rounded-full"
            :class="isConnected ? 'bg-primary' : 'bg-destructive'"
          />
        </span>
        {{ isConnected ? 'En vivo' : 'Desconectado' }}
      </Badge>
    </Teleport>

    <!-- Empty state -->
    <EmptyState
      v-if="events.length === 0"
      :icon="Shield"
      title="Sin accesos registrados hoy"
      description="Los eventos apareceran aqui en tiempo real"
    />

    <!-- Timeline feed -->
    <div v-else class="relative pl-5">
      <!-- Vertical line -->
      <div class="absolute left-[5px] top-1 bottom-1 w-px bg-border" aria-hidden="true" />

      <div class="space-y-2">
        <div
          v-for="event in events"
          :key="event.id"
          class="relative"
        >
          <!-- Dot -->
          <div
            class="absolute -left-5 top-3.5 z-10 size-2.5 rounded-full ring-2 ring-background"
            :class="RESULT_CONFIG[event.result].dotClass"
          />

          <!-- Card -->
          <Card class="min-w-0">
            <CardContent class="px-3 py-2.5">
              <!-- Row 1: Name + Unit + Time -->
              <div class="flex items-center gap-1.5">
                <p class="min-w-0 flex-1 truncate text-sm font-semibold">
                  {{ event.visitorName || 'Visitante' }}
                </p>
                <Badge v-if="event.unitNumber" variant="secondary" class="shrink-0 text-[11px] font-semibold">
                  {{ event.unitNumber }}
                </Badge>
                <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {{ formatAbsoluteTime(event.createdAt) }}
                </span>
              </div>

              <!-- Row 2: Status · Type · Doc · Relative time | Exit button -->
              <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                <span :class="RESULT_CONFIG[event.result].textClass" class="font-medium">
                  {{ RESULT_CONFIG[event.result].label }}
                </span>
                <span class="opacity-30">·</span>
                <component :is="ENTRY_TYPE_CONFIG[event.entryType].icon" class="size-3 shrink-0" />
                <span class="shrink-0">{{ ENTRY_TYPE_CONFIG[event.entryType].label }}</span>
                <template v-if="event.visitorDocument">
                  <span class="opacity-30">·</span>
                  <span class="truncate">{{ event.visitorDocument }}</span>
                </template>
                <span class="ml-auto shrink-0 tabular-nums">{{ formatRelativeTime(event.createdAt) }}</span>

                <!-- Inline exit button or exit info (same slot) -->
                <Button
                  v-if="event.result === 'allowed' && !event.exitAt"
                  size="sm"
                  variant="ghost"
                  class="ml-1 h-6 shrink-0 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  :disabled="exitingId === event.id"
                  @click="handleMarkExit(event.id)"
                >
                  <LogOut class="size-3" />
                  {{ exitingId === event.id ? '...' : 'Salida' }}
                </Button>
                <span v-else-if="event.result === 'allowed' && event.exitAt" class="ml-1 shrink-0 tabular-nums">
                  → {{ formatAbsoluteTime(event.exitAt) }} <span class="font-medium text-foreground/70">({{ formatDuration(event.createdAt, event.exitAt) }})</span>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
