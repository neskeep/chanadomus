<script setup lang="ts">
import {
  CalendarCheck,
  Clock,
  Plus,
  Eye,
  PartyPopper,
  Users,
} from 'lucide-vue-next'
import type { EventStatus } from '~~/shared/types/event'

useHead({ title: 'Mis Eventos' })

const { formatDateTime } = useFormatDate()
const { target, isMounted } = useTopbarPortal()

const {
  events,
  totalPages,
  isLoading,
  error,
  fetchEvents,
} = useEvents()

const filterStatus = ref<EventStatus | ''>('')
const currentPage = ref(1)

const statusOptions = [
  { value: 'pendiente' as const, label: 'Pendiente' },
  { value: 'activo' as const, label: 'Activo' },
  { value: 'completado' as const, label: 'Completado' },
  { value: 'cancelado' as const, label: 'Cancelado' },
]

const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  activo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  completado: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  pendiente: 'Pendiente',
  activo: 'Activo',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

const totalActivos = computed(() => events.value.filter(e => e.status === 'activo').length)
const totalPendientes = computed(() => events.value.filter(e => e.status === 'pendiente').length)

async function loadEvents() {
  const params: { page?: number; status?: EventStatus } = { page: currentPage.value }
  if (filterStatus.value) params.status = filterStatus.value
  await fetchEvents(params)
}

watch([filterStatus], () => {
  currentPage.value = 1
  loadEvents()
})

watch(currentPage, () => loadEvents())

onMounted(() => loadEvents())
</script>

<template>
  <div>
    <!-- Topbar actions -->
    <Teleport v-if="isMounted" :to="target" defer>
      <TopbarFilters :active="filterStatus !== ''" @clear="filterStatus = ''">
        <TopbarFilterGroup v-model="filterStatus" label="Estado" :options="statusOptions" />
      </TopbarFilters>
      <NuxtLink to="/propietario/eventos/crear">
        <Button size="sm">
          <Plus class="mr-1.5 size-3.5" />
          Nuevo
        </Button>
      </NuxtLink>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" as-child>
        <NuxtLink to="/propietario/eventos/crear">
          <Plus class="size-4" />
        </NuxtLink>
      </Button>
    </TopbarMobileAction>

    <!-- Stats cards -->
    <div class="mb-6 grid grid-cols-2 gap-3">
      <StatCard label="Activos" :value="totalActivos" :icon="CalendarCheck" icon-bg-class="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :is-loading="isLoading" />
      <StatCard label="Pendientes" :value="totalPendientes" :icon="Clock" icon-bg-class="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :is-loading="isLoading" />
    </div>

    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="5" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="events.length === 0"
      :icon="PartyPopper"
      title="No tienes eventos"
      :description="filterStatus ? 'Prueba cambiando los filtros' : 'Crea tu primer evento'"
    >
      <template #action>
        <NuxtLink to="/propietario/eventos/crear">
          <Button>
            <Plus class="mr-1.5 size-4" />
            Nuevo Evento
          </Button>
        </NuxtLink>
      </template>
    </EmptyState>

    <!-- Table (desktop) / Cards (mobile) -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Invitados</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in events" :key="item.id">
              <TableCell class="font-medium">{{ item.title }}</TableCell>
              <TableCell>
                <div class="flex items-center gap-1.5 text-sm">
                  <Clock class="size-3.5 shrink-0 text-muted-foreground" />
                  <span>{{ formatDateTime(item.startsAt) }}</span>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1.5 text-sm">
                  <Users class="size-3.5 shrink-0 text-muted-foreground" />
                  <span>{{ item.guestCount }}</span>
                </div>
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                  :class="EVENT_STATUS_COLORS[item.status]"
                >
                  {{ EVENT_STATUS_LABELS[item.status] }}
                </span>
              </TableCell>
              <TableCell class="text-right">
                <Button variant="ghost" size="icon" class="size-10" title="Ver" as-child>
                  <NuxtLink :to="`/propietario/eventos/${item.id}`">
                    <Eye class="size-4" />
                  </NuxtLink>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile cards -->
      <div class="space-y-2 md:hidden">
        <Card v-for="item in events" :key="item.id" class="px-3 py-2.5">
          <div class="flex items-center gap-2">
            <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ item.title }}</p>
            <span
              class="shrink-0 rounded-lg px-1.5 py-0.5 text-[11px] font-medium"
              :class="EVENT_STATUS_COLORS[item.status]"
            >
              {{ EVENT_STATUS_LABELS[item.status] }}
            </span>
          </div>
          <div class="mt-1 flex items-center gap-x-1 text-[11px] text-muted-foreground">
            <span class="tabular-nums">{{ formatDateTime(item.startsAt) }}</span>
            <span class="opacity-30">&middot;</span>
            <span>{{ item.guestCount }} inv.</span>
            <span class="flex-1" />
            <Button variant="ghost" class="h-6 px-2 text-[11px]" as-child>
              <NuxtLink :to="`/propietario/eventos/${item.id}`">
                <Eye class="mr-1 size-3" />
                Ver
              </NuxtLink>
            </Button>
          </div>
        </Card>
      </div>

      <!-- Pagination -->
      <ListPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        class="mt-3"
        @update:current-page="currentPage = $event"
      />
    </div>
  </div>
</template>
