<script setup lang="ts">
import { ShieldAlert, Phone, CheckCircle2, Volume2, MessageCircle, VolumeX } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'default' })
useHead({ title: 'Alertas de Pánico' })

const { alerts, activeAlert, isConnected, hasActiveAlert, dismissAlert, resolveAlert, loadInitialAlerts } = usePanicStream()

const isLoading = ref(true)
const resolveDialogOpen = ref(false)
const resolveNote = ref('')
const isResolving = ref(false)

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `${diffMin}m`
  if (diffHrs < 24) return `${diffHrs}h`
  if (diffDays < 7) return `${diffDays}d`

  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

function formatFull(iso: string): string {
  return new Date(iso).toLocaleDateString('es', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Reactive elapsed time for active alert
const activeAlertElapsed = ref('')
let elapsedInterval: ReturnType<typeof setInterval> | null = null

function updateElapsed() {
  if (!activeAlert.value) {
    activeAlertElapsed.value = ''
    return
  }
  const d = new Date(activeAlert.value.createdAt)
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000)
  const min = Math.floor(diffSec / 60)
  const sec = diffSec % 60
  activeAlertElapsed.value = min > 0
    ? `${min}m ${sec.toString().padStart(2, '0')}s`
    : `${sec}s`
}

watch(hasActiveAlert, (active) => {
  if (active) {
    updateElapsed()
    elapsedInterval = setInterval(updateElapsed, 1000)
  }
  else if (elapsedInterval) {
    clearInterval(elapsedInterval)
    elapsedInterval = null
    activeAlertElapsed.value = ''
  }
}, { immediate: true })

onUnmounted(() => {
  if (elapsedInterval) clearInterval(elapsedInterval)
})

const isOpeningChat = ref(false)

async function openDirectChat() {
  if (!activeAlert.value) return
  isOpeningChat.value = true
  try {
    const { data } = await $fetch('/api/chat/direct', {
      method: 'POST',
      body: { targetUserId: activeAlert.value.userId },
    })
    await navigateTo({
      path: `/mi-chana/chat/${data.roomId}`,
      query: { msg: '🚨 Vigilancia atendiendo alerta de pánico. ¿Se encuentra bien?' },
    })
  }
  catch {
    toast.error('Error al abrir chat directo')
  }
  finally {
    isOpeningChat.value = false
  }
}

function openResolveDialog() {
  resolveNote.value = ''
  resolveDialogOpen.value = true
}

async function handleResolve() {
  if (!activeAlert.value) return
  isResolving.value = true
  try {
    await resolveAlert(activeAlert.value.id, resolveNote.value || undefined)
    resolveDialogOpen.value = false
    toast.success('Alerta atendida correctamente')
  }
  catch {
    toast.error('Error al resolver la alerta')
  }
  finally {
    isResolving.value = false
  }
}

async function handleSilence() {
  if (!activeAlert.value) return
  try {
    await resolveAlert(activeAlert.value.id, 'Alarma silenciada sin atención directa')
    toast.info('Alarma silenciada — registrada en historial')
  }
  catch {
    // Still dismiss locally even if API fails
    dismissAlert()
  }
}

async function handleCall() {
  if (!activeAlert.value) return
  const phone = activeAlert.value.userPhone
  try {
    await resolveAlert(activeAlert.value.id, `Contacto telefónico: ${phone}`)
    toast.success('Llamada registrada — alerta atendida')
  }
  catch {
    // Don't block the call
  }
  if (phone) {
    window.location.href = `tel:${phone}`
  }
}

onMounted(async () => {
  await loadInitialAlerts()
  isLoading.value = false
})
</script>

<template>
  <div class="space-y-6">
    <!-- Connection status -->
    <div class="flex items-center justify-end gap-2">
      <span
        class="inline-block size-2 rounded-lg"
        :class="isConnected ? 'bg-primary' : 'bg-destructive'"
      />
      <span class="text-[11px] text-muted-foreground">
        {{ isConnected ? 'Conectado' : 'Desconectado' }}
      </span>
    </div>

    <!-- EMERGENCY PANEL when activeAlert exists -->
    <div
      v-if="activeAlert"
      class="overflow-hidden rounded-lg border-2 border-destructive"
      role="alert"
      aria-live="assertive"
    >
      <!-- Header bar pulsating -->
      <div class="flex items-center justify-between bg-destructive px-4 py-3 animate-pulse">
        <div class="flex items-center gap-2">
          <ShieldAlert class="size-6 text-destructive-foreground" aria-hidden="true" />
          <span class="text-lg font-bold text-destructive-foreground">ALERTA DE PÁNICO</span>
        </div>
        <div class="flex items-center gap-2">
          <Volume2 class="size-4 text-destructive-foreground animate-pulse" />
          <span class="text-sm tabular-nums text-destructive-foreground/80">{{ activeAlertElapsed }}</span>
        </div>
      </div>

      <!-- Body with person info -->
      <div class="bg-background p-5">
        <div class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <!-- Person info -->
          <div class="flex items-start gap-4">
            <Avatar class="size-16 shrink-0 overflow-hidden ring-2 ring-destructive/30">
              <AvatarImage v-if="activeAlert.userImage" :src="activeAlert.userImage" :alt="activeAlert.userName" />
              <AvatarFallback class="bg-destructive/10 text-destructive text-xl font-bold">
                {{ activeAlert.userName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?' }}
              </AvatarFallback>
            </Avatar>
            <div class="min-w-0">
              <p class="text-xl font-bold">{{ activeAlert.userName }}</p>
              <p class="text-3xl font-bold tabular-nums text-destructive">
                {{ activeAlert.unitLabel ?? activeAlert.unitNumber ?? 'Sin unidad asignada' }}
              </p>
              <p v-if="activeAlert.userEmail" class="mt-1 text-sm text-muted-foreground">
                {{ activeAlert.userEmail }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
            <!-- Call button -->
            <Button
              v-if="activeAlert.userPhone"
              variant="outline"
              size="lg"
              class="gap-2"
              @click="handleCall()"
            >
              <Phone class="size-4" />
              Llamar — {{ activeAlert.userPhone }}
            </Button>
            <p v-else class="text-sm text-muted-foreground">Sin teléfono registrado</p>

            <!-- Resolve button -->
            <Button
              size="lg"
              class="gap-2 bg-primary font-bold"
              @click="openResolveDialog"
            >
              <CheckCircle2 class="size-4" />
              Atender alerta
            </Button>

            <!-- Silence button -->
            <Button
              variant="ghost"
              size="sm"
              class="gap-2 text-muted-foreground"
              @click="handleSilence"
            >
              <VolumeX class="size-4" />
              Silenciar alarma
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Resolve Dialog -->
    <Dialog v-model:open="resolveDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atender alerta</DialogTitle>
          <DialogDescription>
            Contacta al residente o registra la atención de esta emergencia.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-2">
          <!-- Person info card -->
          <div v-if="activeAlert" class="rounded-lg border p-4">
            <div class="flex items-center gap-3">
              <Avatar class="size-12 shrink-0">
                <AvatarImage v-if="activeAlert.userImage" :src="activeAlert.userImage" :alt="activeAlert.userName" />
                <AvatarFallback class="bg-destructive/10 text-destructive text-sm font-bold">
                  {{ activeAlert.userName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?' }}
                </AvatarFallback>
              </Avatar>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-bold">{{ activeAlert.userName }}</p>
                <p class="text-lg font-bold text-destructive">{{ activeAlert.unitLabel ?? activeAlert.unitNumber ?? 'Sin unidad' }}</p>
              </div>
            </div>

            <!-- Quick actions: call + chat -->
            <div class="mt-3 flex gap-2">
              <Button
                v-if="activeAlert.userPhone"
                variant="outline"
                size="sm"
                class="flex-1 gap-2"
                @click="handleCall()"
              >
                <Phone class="size-4" />
                {{ activeAlert.userPhone }}
              </Button>
              <Button
                v-else
                variant="outline"
                size="sm"
                class="flex-1 gap-2"
                disabled
              >
                <Phone class="size-4" />
                Sin teléfono
              </Button>

              <Button
                variant="outline"
                size="sm"
                class="flex-1 gap-2"
                :disabled="isOpeningChat"
                @click="openDirectChat"
              >
                <MessageCircle class="size-4" />
                {{ isOpeningChat ? 'Abriendo...' : 'Chat directo' }}
              </Button>
            </div>
          </div>

          <!-- Note field -->
          <div class="space-y-2">
            <Label for="resolve-note">Nota de atención (opcional)</Label>
            <Textarea
              id="resolve-note"
              v-model="resolveNote"
              placeholder="Ej: Se acudió a la unidad, falsa alarma, se contactó por teléfono..."
              :rows="3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="resolveDialogOpen = false">
            Cancelar
          </Button>
          <Button :disabled="isResolving" @click="handleResolve">
            <CheckCircle2 class="mr-1.5 size-4" />
            <template v-if="isResolving">Registrando...</template>
            <template v-else>Marcar como atendida</template>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Loading skeleton -->
    <ListSkeleton v-if="isLoading" :count="5" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="alerts.length === 0"
      :icon="ShieldAlert"
      title="Sin alertas de pánico"
      description="Los eventos de pánico aparecerán aquí cuando alguien active el botón"
    />

    <!-- Timeline -->
    <div v-else class="relative space-y-0 pl-5">
      <div class="absolute bottom-0 left-[5px] top-0 w-px bg-border" />

      <div
        v-for="alert in alerts"
        :key="alert.id"
        class="relative py-2"
      >
        <!-- Timeline dot -->
        <div
          class="absolute -left-5 top-3.5 size-2.5 rounded-lg ring-2 ring-background"
          :class="alert.resolvedAt ? 'bg-primary' : 'bg-destructive'"
        />

        <!-- Row 1: name + unit + status + time -->
        <div class="flex items-center gap-1.5">
          <ShieldAlert class="size-3.5 shrink-0 text-destructive" aria-hidden="true" />
          <span class="min-w-0 flex-1 truncate text-sm font-semibold">{{ alert.userName }}</span>
          <Badge v-if="alert.unitNumber" variant="outline" class="shrink-0 text-[11px]">
            {{ alert.unitLabel ?? alert.unitNumber }}
          </Badge>
          <Badge v-if="alert.resolvedAt" variant="secondary" class="shrink-0 text-[11px]">
            Atendida
          </Badge>
          <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {{ formatRelative(alert.createdAt) }}
          </span>
        </div>

        <!-- Row 2: resolved info or full date -->
        <div class="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span class="tabular-nums">{{ formatFull(alert.createdAt) }}</span>
          <template v-if="alert.resolvedAt">
            <span class="opacity-30">·</span>
            <span>{{ alert.resolverName ?? 'Vigilancia' }}</span>
            <template v-if="alert.resolvedNote">
              <span class="opacity-30">·</span>
              <span class="truncate">{{ alert.resolvedNote }}</span>
            </template>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
