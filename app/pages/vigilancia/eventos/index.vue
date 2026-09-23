<script setup lang="ts">
import {
  PartyPopper,
  Clock,
  Users,
  ArrowRight,
} from 'lucide-vue-next'
import type { EventSummary } from '~~/shared/types/event'
import { eventGuardPhase } from '~~/shared/lib/event-window'

useHead({ title: 'Eventos Activos' })

const { isLoading, error, fetchActiveEvents } = useEvents()
const { formatDateTime } = useFormatDate()

const activeEvents = ref<EventSummary[]>([])
const loadedAt = ref<Date | null>(null)

// Los eventos terminados siguen en la lista mientras queden invitados dentro
// (o poco despues del fin): se marcan para que el guardia sepa que solo registra salidas.
function finishedLabel(item: EventSummary): string | null {
  if (!loadedAt.value || eventGuardPhase(item, loadedAt.value) !== 'finalizado') return null
  if (item.guestsInside === 0) return 'Finalizado'
  return item.guestsInside === 1 ? 'Finalizado, queda 1 dentro' : `Finalizado, quedan ${item.guestsInside} dentro`
}

onMounted(async () => {
  try {
    activeEvents.value = await fetchActiveEvents()
    loadedAt.value = new Date()
  }
  catch {
    // error set by composable
  }
})
</script>

<template>
  <div>
    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="3" variant="card" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="activeEvents.length === 0"
      :icon="PartyPopper"
      title="No hay eventos activos hoy"
      description="Aquí verás los eventos aprobados del día y los que terminaron con invitados dentro"
    />

    <!-- Active event cards -->
    <div v-else class="grid gap-4 md:grid-cols-2">
      <Card v-for="item in activeEvents" :key="item.id" class="overflow-hidden">
        <CardContent class="p-5 md:p-6">
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <h3 class="text-lg font-bold">{{ item.title }}</h3>
                <div class="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" class="font-semibold">
                    {{ item.unitLabel || item.unitNumber }}
                  </Badge>
                  <Badge v-if="finishedLabel(item)" variant="outline" class="font-semibold">
                    {{ finishedLabel(item) }}
                  </Badge>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock class="size-4 shrink-0" />
              <span>{{ formatDateTime(item.startsAt) }} — {{ formatDateTime(item.endsAt) }}</span>
            </div>

            <div class="flex items-center gap-1.5 text-sm">
              <Users class="size-4 shrink-0 text-muted-foreground" />
              <span class="font-medium">{{ item.guestsInside }} dentro</span>
              <span class="text-muted-foreground">/ {{ item.guestCount }} total</span>
            </div>

            <NuxtLink :to="`/vigilancia/eventos/${item.id}`">
              <Button class="mt-2 w-full">
                Gestionar
                <ArrowRight class="ml-1.5 size-4" />
              </Button>
            </NuxtLink>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
