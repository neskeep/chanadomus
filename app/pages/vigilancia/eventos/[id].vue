<script setup lang="ts">
import {
  Search,
  LogIn,
  LogOut,
  CheckCircle2,
  ArrowLeft,
  Users,
  Car,
  IdCard,
  Loader2,
  Info,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { EventDetail, EventGuest, GuestStatus } from '~~/shared/types/event'
import { canCheckInEvent, canCheckOutEvent, AUTO_CHECKOUT_LABEL, eventGuardPhase, isAutoCheckout, EVENT_LATE_CHECKIN_GRACE_MS } from '~~/shared/lib/event-window'

const route = useRoute()
const id = route.params.id as string

const { isLoading: eventLoading, error: eventError, fetchEvent } = useEvents()

const {
  isLoading,
  error,
  searchQuery,
  statusFilter,
  stats,
  filteredGuests,
  loadGuests,
  checkin,
  checkout,
  undoCheckout,
  isGuestBusy,
  isRecentlyChanged,
} = useEventCheckin(id)

const event = ref<EventDetail | null>(null)
const loaded = ref(false)

useHead({ title: computed(() => event.value?.title ?? 'Check-in') })

// Time since entry helper
const clientNow = ref<number>(0)
let tickInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  clientNow.value = Date.now()
  tickInterval = setInterval(() => { clientNow.value = Date.now() }, 30000)

  try {
    event.value = await fetchEvent(id)
    loaded.value = true
    await loadGuests()
  }
  catch {
    // error set by composable
  }
})

onBeforeUnmount(() => {
  if (tickInterval) clearInterval(tickInterval)
})

function formatTimeSince(dateStr: string | null): string {
  if (!dateStr || !clientNow.value) return ''
  const diffMs = clientNow.value - new Date(dateStr).getTime()
  const diffMin = Math.max(0, Math.floor(diffMs / 60000))
  if (diffMin < 60) return `${diffMin}m`
  const hours = Math.floor(diffMin / 60)
  const mins = diffMin % 60
  return `${hours}h ${mins}m`
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Fase del evento segun el reloj del cliente (null hasta montar, para no parpadear en SSR)
const phase = computed(() => {
  if (!event.value || !clientNow.value) return null
  return eventGuardPhase(event.value, new Date(clientNow.value))
})

const checkinAllowed = computed(() => {
  if (!event.value) return false
  if (!clientNow.value) return true
  return canCheckInEvent(event.value, new Date(clientNow.value))
})

const lateCheckinUntil = computed(() => {
  if (!event.value) return ''
  return formatTime(new Date(new Date(event.value.endsAt).getTime() + EVENT_LATE_CHECKIN_GRACE_MS).toISOString())
})

async function runAction(
  action: () => Promise<EventGuest | null>,
  fallbackError: string,
  onDone: (guest: EventGuest) => void,
) {
  try {
    const updated = await action()
    if (updated) onDone(updated)
  }
  catch (err: unknown) {
    toast.error(getApiErrorMessage(err, fallbackError))
    // 409 = otro guardia ya lo registro: refrescar para no operar sobre datos viejos
    if ((err as { statusCode?: number } | null)?.statusCode === 409) void loadGuests()
  }
}

function handleCheckin(guestId: string) {
  return runAction(() => checkin(guestId), 'Error al registrar entrada', (g) => {
    toast.success(`Entrada registrada: ${g.name}`)
  })
}

function handleCheckout(guestId: string) {
  return runAction(() => checkout(guestId), 'Error al registrar salida', (g) => {
    toast.success(`Salida registrada: ${g.name}`, {
      duration: 8000,
      action: {
        label: 'Deshacer',
        onClick: () => { void handleUndoCheckout(g.id) },
      },
    })
  })
}

function handleUndoCheckout(guestId: string) {
  return runAction(() => undoCheckout(guestId), 'No se pudo deshacer la salida', (g) => {
    toast.info(`Salida anulada: ${g.name} sigue dentro`)
  })
}

const checkoutAllowed = computed(() => !!event.value && canCheckOutEvent(event.value))

const tabOptions: { value: GuestStatus | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'dentro', label: 'Dentro' },
  { value: 'salio', label: 'Salieron' },
]
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="eventLoading && !loaded" class="space-y-4">
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-48 w-full" />
    </div>

    <!-- Error -->
    <ErrorAlert v-else-if="(eventError || error) && !loaded" :message="eventError || error || 'Error'" />

    <!-- Content -->
    <div v-else-if="event" class="space-y-4">
      <!-- Top bar: back + title + stats -->
      <div class="sticky top-0 z-10 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:-mx-6 md:px-6">
        <div class="flex items-center gap-3">
          <NuxtLink to="/vigilancia/eventos" class="shrink-0">
            <Button variant="ghost" size="icon" class="size-8">
              <ArrowLeft class="size-4" />
            </Button>
          </NuxtLink>
          <div class="min-w-0 flex-1">
            <h1 class="truncate text-base font-bold md:text-lg">{{ event.title }}</h1>
            <Badge variant="secondary" class="text-[10px] font-semibold">
              {{ event.unitLabel || event.unitNumber }}
            </Badge>
          </div>
          <div class="flex shrink-0 items-center gap-2 text-sm">
            <span class="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold tabular-nums text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              {{ stats.inside }} dentro
            </span>
            <span class="rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium tabular-nums text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              {{ stats.pending }} pend.
            </span>
            <span class="hidden rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-400 sm:inline-flex">
              {{ stats.exited }} salieron
            </span>
          </div>
        </div>
      </div>

      <!-- Evento finalizado: se siguen registrando salidas -->
      <Card v-if="phase === 'finalizado'" class="border-primary/30 bg-primary/5" role="status">
        <CardContent class="flex items-start gap-3 px-4 py-3">
          <Info class="mt-0.5 size-4 shrink-0 text-primary" />
          <div class="min-w-0">
            <p class="text-sm font-semibold">
              {{ stats.inside === 0 ? 'Evento finalizado' : stats.inside === 1 ? 'Evento finalizado, queda 1 invitado dentro' : `Evento finalizado, quedan ${stats.inside} invitados dentro` }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ checkinAllowed ? `Puedes registrar salidas. Se admiten entradas tardías hasta las ${lateCheckinUntil}.` : 'Puedes registrar salidas. Ya no se admiten entradas.' }}
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Salida masiva al cierre del evento -->
      <div v-if="checkoutAllowed && stats.inside > 0" class="flex justify-end">
        <EventCheckoutAllButton :event-id="id" :inside-count="stats.inside" @done="loadGuests()" />
      </div>

      <!-- Search -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Buscar invitado por nombre, cédula o placa..."
          class="h-12 pl-11 text-base"
          autofocus
        />
      </div>

      <!-- Tabs -->
      <Tabs v-model="statusFilter" class="w-full">
        <TabsList class="w-full">
          <TabsTrigger
            v-for="tab in tabOptions"
            :key="tab.value"
            :value="tab.value"
            class="flex-1"
          >
            {{ tab.label }}
            <span class="ml-1 text-xs tabular-nums text-muted-foreground">
              {{ tab.value === 'todos' ? stats.total : tab.value === 'pendiente' ? stats.pending : tab.value === 'dentro' ? stats.inside : stats.exited }}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <!-- Loading guests -->
      <ListSkeleton v-if="isLoading" :count="5" variant="row" />

      <!-- Error -->
      <ErrorAlert v-if="error" :message="error" class="mb-4" />

      <!-- Empty for current filter -->
      <EmptyState
        v-else-if="filteredGuests.length === 0"
        :icon="Users"
        :title="searchQuery ? 'Sin resultados' : 'Sin invitados en esta categoría'"
        :description="searchQuery ? 'Intenta con otro término de búsqueda' : ''"
      />

      <!-- Guest list -->
      <div v-else class="space-y-0">
        <div
          v-for="(guest, idx) in filteredGuests"
          :key="guest.id"
        >
          <Separator v-if="idx > 0" />
          <div class="flex min-h-14 items-center gap-3 py-2.5">
            <!-- Guest info -->
            <div class="min-w-0 flex-1">
              <p class="truncate text-base font-medium">{{ guest.name }}</p>
              <div v-if="guest.document || guest.vehiclePlate" class="mt-0.5 flex items-center gap-x-2 text-xs text-muted-foreground">
                <template v-if="guest.document">
                  <IdCard class="size-3 shrink-0" />
                  <span>{{ guest.document }}</span>
                </template>
                <template v-if="guest.vehiclePlate">
                  <Car class="size-3 shrink-0" />
                  <span class="font-mono text-xs font-semibold tracking-wider">{{ guest.vehiclePlate }}</span>
                </template>
              </div>
            </div>

            <!-- Recien cambiado: confirmacion sin botones (evita que un segundo toque actue) -->
            <div
              v-if="isRecentlyChanged(guest.id)"
              class="flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted-foreground"
              role="status"
            >
              <CheckCircle2 class="size-4 text-primary" />
              <span>{{ guest.status === 'salio' ? 'Salida registrada' : 'Entrada registrada' }}</span>
            </div>

            <!-- Pendiente: Green "Entrada" button -->
            <template v-else-if="guest.status === 'pendiente'">
              <Button
                v-if="checkinAllowed"
                class="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
                :disabled="isGuestBusy(guest.id)"
                @click="handleCheckin(guest.id)"
              >
                <Loader2 v-if="isGuestBusy(guest.id)" class="mr-1.5 size-4 animate-spin" />
                <LogIn v-else class="mr-1.5 size-4" />
                Entrada
              </Button>
              <span v-else class="shrink-0 text-xs text-muted-foreground">Entrada cerrada</span>
            </template>

            <!-- Dentro: Orange "Salida" button + time since -->
            <div v-else-if="guest.status === 'dentro'" class="flex shrink-0 items-center gap-2">
              <span class="text-xs tabular-nums text-muted-foreground">{{ formatTimeSince(guest.checkedInAt) }}</span>
              <Button
                variant="outline"
                class="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
                :disabled="isGuestBusy(guest.id)"
                @click="handleCheckout(guest.id)"
              >
                <Loader2 v-if="isGuestBusy(guest.id)" class="mr-1.5 size-4 animate-spin" />
                <LogOut v-else class="mr-1.5 size-4" />
                Salida
              </Button>
            </div>

            <!-- Salio: Gray completed text -->
            <div v-else-if="guest.status === 'salio'" class="flex shrink-0 items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 class="size-4" />
              <span class="text-xs">
                {{ formatTime(guest.checkedOutAt) }}<template v-if="isAutoCheckout(guest)"> · {{ AUTO_CHECKOUT_LABEL }}</template>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
