<script setup lang="ts">
import { AlertTriangle, Calendar, DoorOpen, Megaphone, QrCode, Shield, Users } from 'lucide-vue-next'
import { ICON_BG } from '~/composables/useColorMap'

useHead({ title: 'Panel Vigilancia' })

const { user } = useAuth()
const { formatDate, formatDateTime } = useFormatDate()

interface DashboardStats {
  openIncidents: number
  todayAccessCount: number
  publishedAnnouncements: number
  upcomingMeetings: number
  nextMeeting: { title: string; date: string } | null
}

const stats = ref<DashboardStats | null>(null)
const isLoading = ref(true)

const today = ref('')

const quickActions = [
  { label: 'Registrar Acceso', icon: DoorOpen, to: '/vigilancia/accesos' },
  { label: 'Escanear QR', icon: QrCode, to: '/vigilancia/escanear' },
  { label: 'Residentes', icon: Users, to: '/vigilancia/residentes' },
] as const

onMounted(async () => {
  today.value = formatDate(new Date())
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
        {{ today }}
      </p>
    </div>

    <!-- Hero stat: Accesos Hoy -->
    <Card class="mb-4 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-muted-foreground">Accesos Hoy</p>
          <template v-if="isLoading">
            <Skeleton class="mt-2 h-10 w-20" />
          </template>
          <p v-else class="mt-1 text-4xl font-bold tracking-tight">
            {{ stats?.todayAccessCount ?? 0 }}
          </p>
        </div>
        <div class="flex flex-col items-end gap-2">
          <div :class="['flex size-12 items-center justify-center rounded-lg', ICON_BG.info]">
            <Shield class="size-6" />
          </div>
          <Badge variant="secondary" class="gap-1.5">
            <span class="relative flex size-2">
              <span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span class="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            En vivo
          </Badge>
        </div>
      </div>
    </Card>

    <!-- Stats grid -->
    <div class="grid grid-cols-2 gap-3">
      <StatCard
        label="Incidencias Abiertas"
        :value="stats?.openIncidents ?? 0"
        :icon="AlertTriangle"
        :icon-bg-class="ICON_BG.warning"
        :is-loading="isLoading"
      />
      <StatCard
        label="Anuncios"
        :value="stats?.publishedAnnouncements ?? 0"
        :icon="Megaphone"
        :icon-bg-class="ICON_BG.teal"
        :is-loading="isLoading"
      />
      <StatCard
        label="Reuniones Proximas"
        :value="stats?.upcomingMeetings ?? 0"
        :icon="Calendar"
        :icon-bg-class="ICON_BG.success"
        :is-loading="isLoading"
      />
    </div>

    <!-- Quick actions -->
    <div class="mt-6">
      <h2 class="mb-3 text-base font-semibold text-foreground">Acciones rapidas</h2>
      <div class="grid grid-cols-3 gap-3">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
        >
          <Button
            variant="outline"
            size="lg"
            class="flex h-auto min-h-14 w-full flex-col gap-1.5 py-3"
          >
            <component :is="action.icon" class="size-5" />
            <span class="text-xs leading-tight">{{ action.label }}</span>
          </Button>
        </NuxtLink>
      </div>
    </div>

    <!-- Next meeting -->
    <div v-if="stats?.nextMeeting" class="mt-4 rounded-lg border border-l-4 border-l-primary bg-card p-4">
      <div class="flex items-center gap-1.5">
        <Calendar class="size-4 text-muted-foreground" />
        <p class="text-xs text-muted-foreground">Proxima reunion</p>
      </div>
      <p class="mt-0.5 text-base font-semibold">{{ stats.nextMeeting.title }}</p>
      <p class="text-xs text-muted-foreground">{{ formatDateTime(stats.nextMeeting.date) }}</p>
    </div>
  </div>
</template>
