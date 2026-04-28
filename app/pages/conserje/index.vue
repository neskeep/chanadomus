<script setup lang="ts">
import { Calendar, ClipboardList, Megaphone, Shield, Store, Wrench } from 'lucide-vue-next'

useHead({ title: 'Panel Conserjeria' })

const { user } = useAuth()
const { formatDateTime } = useFormatDate()

interface DashboardStats {
  todayAccessCount: number
  publishedAnnouncements: number
  activeProviders: number
  upcomingMeetings: number
  nextMeeting: { title: string; date: string } | null
}

const stats = ref<DashboardStats | null>(null)
const isLoading = ref(true)

const statCards = computed(() => [
  {
    label: 'Accesos Hoy',
    value: stats.value?.todayAccessCount ?? 0,
    icon: Shield,
    iconBgClass: 'bg-blue-100 text-blue-600',
  },
  {
    label: 'Anuncios',
    value: stats.value?.publishedAnnouncements ?? 0,
    icon: Megaphone,
    iconBgClass: 'bg-cyan-100 text-cyan-600',
  },
  {
    label: 'Proveedores',
    value: stats.value?.activeProviders ?? 0,
    icon: Wrench,
    iconBgClass: 'bg-emerald-100 text-emerald-600',
  },
  {
    label: 'Reuniones Proximas',
    value: stats.value?.upcomingMeetings ?? 0,
    icon: Calendar,
    iconBgClass: 'bg-purple-100 text-purple-600',
  },
])

const quickActions = [
  { label: 'Registrar Acceso', to: '/vigilancia/accesos', icon: ClipboardList },
  { label: 'Proveedores', to: '/mi-chana/proveedores', icon: Store },
  { label: 'Cartelera', to: '/mi-chana/cartelera', icon: Megaphone },
]

const todayFormatted = ref('')

onMounted(async () => {
  todayFormatted.value = formatDateTime(new Date())
  try {
    const res = await $fetch<{ data: DashboardStats }>('/api/dashboard/stats')
    stats.value = res.data
  } catch {
    // silent
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Greeting -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-foreground">
        Hola, {{ user?.name?.split(' ')[0] || 'Operador' }}
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ todayFormatted }}
      </p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3">
      <StatCard
        v-for="card in statCards"
        :key="card.label"
        :label="card.label"
        :value="card.value"
        :icon="card.icon"
        :icon-bg-class="card.iconBgClass"
        :is-loading="isLoading"
      />
    </div>

    <!-- Quick Actions -->
    <div class="mt-6">
      <h2 class="mb-3 text-base font-semibold text-foreground">Acciones rapidas</h2>
      <div class="grid grid-cols-2 gap-3">
        <Button
          v-for="action in quickActions"
          :key="action.to"
          variant="outline"
          size="lg"
          as="NuxtLink"
          :to="action.to"
          class="h-12 gap-2 text-sm"
        >
          <component :is="action.icon" class="size-5" />
          {{ action.label }}
        </Button>
      </div>
    </div>

    <!-- Next Meeting -->
    <div v-if="stats?.nextMeeting" class="mt-6 rounded-lg border border-l-4 border-l-primary bg-card p-4">
      <div class="flex items-center gap-1.5">
        <Calendar class="size-4 text-muted-foreground" />
        <p class="text-xs text-muted-foreground">Proxima reunion</p>
      </div>
      <p class="mt-0.5 text-base font-semibold">{{ stats.nextMeeting.title }}</p>
      <p class="text-xs text-muted-foreground">{{ formatDateTime(stats.nextMeeting.date) }}</p>
    </div>
  </div>
</template>
