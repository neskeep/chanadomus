<script setup lang="ts">
import { Shield, CheckCircle2, XCircle, AlertTriangle } from 'lucide-vue-next'
import type { AccessResult, EntryType } from '~~/shared/types/access'

useHead({ title: 'Panel de Accesos' })

const { events, isConnected, loadInitialEvents } = useAccessStream()

onMounted(async () => {
  await loadInitialEvents()
})

function borderColorClass(result: AccessResult): string {
  const map: Record<AccessResult, string> = {
    allowed: 'border-l-green-500',
    denied: 'border-l-red-500',
    expired: 'border-l-amber-500',
    already_used: 'border-l-amber-500',
  }
  return map[result]
}

function iconBgClass(result: AccessResult): string {
  const map: Record<AccessResult, string> = {
    allowed: 'bg-green-100 text-green-600',
    denied: 'bg-red-100 text-red-600',
    expired: 'bg-amber-100 text-amber-600',
    already_used: 'bg-amber-100 text-amber-600',
  }
  return map[result]
}

function entryTypeLabel(type: EntryType): string {
  const map: Record<EntryType, string> = {
    qr: 'Código QR',
    manual: 'Registro manual',
    webhook: 'Dispositivo',
  }
  return map[type]
}

function formatTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`

  return date.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header sticky -->
    <div class="sticky top-14 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
      <div class="flex items-center justify-end">
        <Badge
          :class="isConnected ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'"
          variant="outline"
          class="gap-1.5"
        >
          <span
            class="size-2 rounded-full"
            :class="isConnected ? 'bg-green-500' : 'bg-red-500'"
          />
          {{ isConnected ? 'En vivo' : 'Desconectado' }}
        </Badge>
      </div>
    </div>

    <!-- Feed de eventos -->
    <div class="p-4 space-y-3">
      <!-- Empty state -->
      <div v-if="events.length === 0" class="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Shield class="size-16 stroke-1 mb-4" />
        <p class="text-lg font-medium">Sin accesos registrados hoy</p>
        <p class="text-sm">Los eventos aparecerán aquí en tiempo real</p>
      </div>

      <!-- Event cards -->
      <Card
        v-for="event in events"
        :key="event.id"
        :class="borderColorClass(event.result)"
        class="border-l-4"
      >
        <CardContent class="p-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <!-- Status icon -->
              <div :class="iconBgClass(event.result)" class="rounded-full p-2">
                <CheckCircle2 v-if="event.result === 'allowed'" class="size-5" />
                <XCircle v-if="event.result === 'denied'" class="size-5" />
                <AlertTriangle v-if="event.result === 'expired' || event.result === 'already_used'" class="size-5" />
              </div>
              <div>
                <p class="text-base font-semibold">{{ event.visitorName || 'Visitante' }}</p>
                <p v-if="event.visitorDocument" class="text-sm text-muted-foreground">
                  {{ event.visitorDocument }}
                </p>
              </div>
            </div>
            <!-- Unit badge -->
            <Badge v-if="event.unitNumber" variant="outline">
              {{ event.unitNumber }}
            </Badge>
          </div>
          <!-- Footer: entry type + time -->
          <div class="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{{ entryTypeLabel(event.entryType) }}</span>
            <span>{{ formatTime(event.createdAt) }}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
