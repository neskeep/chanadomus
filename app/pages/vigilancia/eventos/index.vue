<script setup lang="ts">
import {
  PartyPopper,
  Clock,
  Users,
  ArrowRight,
} from 'lucide-vue-next'
import type { EventSummary } from '~~/shared/types/event'

useHead({ title: 'Eventos Activos' })

const { isLoading, error, fetchActiveEvents } = useEvents()
const { formatDateTime } = useFormatDate()

const activeEvents = ref<EventSummary[]>([])

onMounted(async () => {
  try {
    activeEvents.value = await fetchActiveEvents()
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
      description="Los eventos activos aparecerán aquí cuando inicien"
    />

    <!-- Active event cards -->
    <div v-else class="grid gap-4 md:grid-cols-2">
      <Card v-for="item in activeEvents" :key="item.id" class="overflow-hidden">
        <CardContent class="p-5 md:p-6">
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <h3 class="text-lg font-bold">{{ item.title }}</h3>
                <Badge variant="secondary" class="mt-1 font-semibold">
                  {{ item.unitLabel || item.unitNumber }}
                </Badge>
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
