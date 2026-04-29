<script setup lang="ts">
import {
  AlertTriangle,
  Calendar,
  MessageCircle,
  Megaphone,
  Vote,
  ClipboardList,
} from 'lucide-vue-next'
import { buttonVariants } from '~/components/ui/button'
import { ICON_BG } from '~/composables/useColorMap'

useHead({ title: 'Mi Vivienda' })

const { user } = useAuth()
const { formatDateTime, formatDate } = useFormatDate()

interface DashboardStats {
  myOpenIncidents: number
  activePolls: number
  publishedAnnouncements: number
  upcomingMeetings: number
  nextMeeting: { title: string; date: string } | null
}

const stats = ref<DashboardStats | null>(null)
const isLoading = ref(true)

const statCards = computed(() => [
  {
    label: 'Mis Incidencias',
    value: stats.value?.myOpenIncidents ?? 0,
    icon: AlertTriangle,
    iconBgClass: ICON_BG.warning,
  },
  {
    label: 'Votaciones Activas',
    value: stats.value?.activePolls ?? 0,
    icon: Vote,
    iconBgClass: ICON_BG.purple,
  },
  {
    label: 'Anuncios',
    value: stats.value?.publishedAnnouncements ?? 0,
    icon: Megaphone,
    iconBgClass: ICON_BG.info,
  },
  {
    label: 'Reuniones Proximas',
    value: stats.value?.upcomingMeetings ?? 0,
    icon: Calendar,
    iconBgClass: ICON_BG.success,
  },
])

const quickActions = [
  { label: 'Reportar Incidencia', to: '/propietario/incidencias', icon: ClipboardList },
  { label: 'Ver Cartelera', to: '/mi-chana/cartelera', icon: Megaphone },
  { label: 'Votaciones', to: '/mi-chana/votaciones', icon: Vote },
  { label: 'Chat', to: '/mi-chana/chat', icon: MessageCircle },
] as const

const todayFormatted = ref('')
onMounted(() => { todayFormatted.value = formatDate(new Date()) })

onMounted(async () => {
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
        Hola, {{ user?.name?.split(' ')[0] || 'Vecino' }}
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ todayFormatted }}
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-3">
      <StatCard
        v-for="(card, i) in statCards"
        :key="i"
        :label="card.label"
        :value="card.value"
        :icon="card.icon"
        :icon-bg-class="card.iconBgClass"
        :is-loading="isLoading"
      />
    </div>

    <!-- Quick Actions -->
    <section class="mt-6" aria-label="Acciones rapidas">
      <h2 class="mb-3 text-base font-semibold text-foreground">
        Acciones rapidas
      </h2>
      <div class="grid grid-cols-2 gap-3">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
          :class="buttonVariants({ variant: 'outline', size: 'lg' })"
          class="h-auto flex-col gap-2 py-4"
        >
          <component :is="action.icon" class="size-6" />
          <span class="text-sm">{{ action.label }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- Next Meeting -->
    <div
      v-if="stats?.nextMeeting"
      class="mt-6 rounded-lg border border-l-4 border-l-primary bg-card p-4"
    >
      <div class="flex items-center gap-1.5 text-muted-foreground">
        <Calendar class="size-4" />
        <p class="text-sm font-medium">Proxima reunion</p>
      </div>
      <p class="mt-1 text-lg font-semibold">{{ stats.nextMeeting.title }}</p>
      <p class="text-sm text-muted-foreground">
        {{ formatDateTime(stats.nextMeeting.date) }}
      </p>
    </div>
  </div>
</template>
