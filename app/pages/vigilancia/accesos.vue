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
  dotClass: string
  bgClass: string
  textClass: string
  badgeClass: string
}> = {
  allowed: {
    label: 'Permitido',
    dotClass: 'bg-primary',
    bgClass: '',
    textClass: 'text-primary',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
  },
  denied: {
    label: 'Denegado',
    dotClass: 'bg-destructive',
    bgClass: 'bg-destructive/5 border-destructive/20',
    textClass: 'text-destructive',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  expired: {
    label: 'Expirado',
    dotClass: 'bg-amber-500',
    bgClass: 'bg-amber-50 border-amber-200/50',
    textClass: 'text-amber-600',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  already_used: {
    label: 'Ya usado',
    dotClass: 'bg-amber-500',
    bgClass: 'bg-amber-50 border-amber-200/50',
    textClass: 'text-amber-600',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
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
    <div v-else class="relative">
      <!-- Vertical timeline line -->
      <div class="absolute left-[27px] top-0 bottom-0 w-px bg-border" aria-hidden="true" />

      <!-- Event items -->
      <div class="space-y-1">
        <div
          v-for="(event, index) in events"
          :key="event.id"
          class="group relative flex gap-3 py-2"
        >
          <!-- Timeline dot -->
          <div class="relative z-10 flex w-[54px] shrink-0 flex-col items-center pt-1">
            <div
              class="flex size-5 items-center justify-center rounded-full ring-4 ring-background"
              :class="RESULT_CONFIG[event.result].dotClass"
            >
              <CheckCircle2 v-if="event.result === 'allowed'" class="size-3 text-white" />
              <XCircle v-if="event.result === 'denied'" class="size-3 text-white" />
              <AlertTriangle v-if="event.result === 'expired' || event.result === 'already_used'" class="size-3 text-white" />
            </div>
            <!-- Time below dot -->
            <span class="mt-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {{ formatAbsoluteTime(event.createdAt) }}
            </span>
          </div>

          <!-- Event card -->
          <Card
            class="min-w-0 flex-1 transition-colors"
            :class="RESULT_CONFIG[event.result].bgClass"
          >
            <CardContent class="p-3">
              <!-- Row 1: Name + Unit badge -->
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold leading-tight">
                    {{ event.visitorName || 'Visitante' }}
                  </p>
                </div>
                <Badge v-if="event.unitNumber" variant="secondary" class="shrink-0 font-semibold">
                  {{ event.unitNumber }}
                </Badge>
              </div>

              <!-- Row 2: Meta line — status · type · document · relative time -->
              <div class="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
                <span :class="RESULT_CONFIG[event.result].textClass" class="font-semibold">
                  {{ RESULT_CONFIG[event.result].label }}
                </span>
                <span class="text-muted-foreground/40">·</span>
                <span class="flex items-center gap-1 text-muted-foreground">
                  <component :is="ENTRY_TYPE_CONFIG[event.entryType].icon" class="size-3" />
                  {{ ENTRY_TYPE_CONFIG[event.entryType].label }}
                </span>
                <template v-if="event.visitorDocument">
                  <span class="text-muted-foreground/40">·</span>
                  <span class="text-muted-foreground">{{ event.visitorDocument }}</span>
                </template>
                <span class="ml-auto tabular-nums text-muted-foreground">
                  {{ formatRelativeTime(event.createdAt) }}
                </span>
              </div>

              <!-- Exit tracking: mark exit button -->
              <div v-if="event.result === 'allowed' && !event.exitAt" class="mt-2 flex items-center justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  class="h-8 gap-1.5 text-xs"
                  :disabled="exitingId === event.id"
                  @click="handleMarkExit(event.id)"
                >
                  <LogOut class="size-3.5" />
                  {{ exitingId === event.id ? 'Marcando...' : 'Marcar salida' }}
                </Button>
              </div>

              <!-- Exit tracking: exit recorded -->
              <div v-if="event.result === 'allowed' && event.exitAt" class="mt-2 text-xs text-muted-foreground">
                <span>Entrada {{ formatAbsoluteTime(event.createdAt) }} → Salida {{ formatAbsoluteTime(event.exitAt) }}</span>
                <span class="ml-1.5 font-medium text-foreground/70">({{ formatDuration(event.createdAt, event.exitAt) }})</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
