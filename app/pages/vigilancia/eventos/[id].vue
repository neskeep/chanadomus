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
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { EventDetail, GuestStatus } from '~~/shared/types/event'

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

async function handleCheckin(guestId: string) {
  try {
    await checkin(guestId)
  }
  catch {
    toast.error(error.value ?? 'Error al registrar entrada')
  }
}

async function handleCheckout(guestId: string) {
  try {
    await checkout(guestId)
  }
  catch {
    toast.error(error.value ?? 'Error al registrar salida')
  }
}

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

            <!-- Action based on status -->
            <!-- Pendiente: Green "Entrada" button -->
            <Button
              v-if="guest.status === 'pendiente'"
              class="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
              @click="handleCheckin(guest.id)"
            >
              <LogIn class="mr-1.5 size-4" />
              Entrada
            </Button>

            <!-- Dentro: Orange "Salida" button + time since -->
            <div v-else-if="guest.status === 'dentro'" class="flex shrink-0 items-center gap-2">
              <span class="text-xs tabular-nums text-muted-foreground">{{ formatTimeSince(guest.checkedInAt) }}</span>
              <Button
                variant="outline"
                class="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
                @click="handleCheckout(guest.id)"
              >
                <LogOut class="mr-1.5 size-4" />
                Salida
              </Button>
            </div>

            <!-- Salio: Gray completed text -->
            <div v-else-if="guest.status === 'salio'" class="flex shrink-0 items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 class="size-4" />
              <span class="text-xs">{{ formatTime(guest.checkedOutAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
