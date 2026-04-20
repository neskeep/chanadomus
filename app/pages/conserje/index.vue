<script setup lang="ts">
import {
  Calendar,
  Megaphone,
  Shield,
  Wrench,
} from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const { user } = useAuth()

interface DashboardStats {
  openIncidents: number
  inProgressIncidents: number
  activePolls: number
  upcomingMeetings: number
  nextMeeting: { title: string; date: string } | null
  publishedAnnouncements: number
  activeProviders: number
  totalUnits: number
  unitsInDebt: number
  pendingProviders: number
  myOpenIncidents: number
  todayAccessCount: number
}

const stats = ref<DashboardStats | null>(null)
const isLoading = ref(true)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  try {
    const res = await $fetch<{ data: DashboardStats }>('/api/dashboard/stats')
    stats.value = res.data
  } catch {
    // silent fail, stats stay null
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold tracking-tight">Panel Conserjeria</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Hola, {{ user?.name }}
    </p>

    <div class="mt-6 grid grid-cols-2 gap-3">
      <!-- Accesos Hoy -->
      <Card>
        <CardContent class="p-4">
          <template v-if="isLoading">
            <div class="flex items-center justify-between">
              <div class="space-y-2">
                <Skeleton class="h-7 w-10" />
                <Skeleton class="h-3 w-24" />
              </div>
              <Skeleton class="size-10 rounded-lg" />
            </div>
          </template>
          <div v-else class="flex items-center justify-between">
            <div>
              <p class="text-2xl font-bold">{{ stats?.todayAccessCount ?? 0 }}</p>
              <p class="text-xs text-muted-foreground">Accesos Hoy</p>
            </div>
            <div class="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Shield class="size-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Anuncios -->
      <Card>
        <CardContent class="p-4">
          <template v-if="isLoading">
            <div class="flex items-center justify-between">
              <div class="space-y-2">
                <Skeleton class="h-7 w-10" />
                <Skeleton class="h-3 w-24" />
              </div>
              <Skeleton class="size-10 rounded-lg" />
            </div>
          </template>
          <div v-else class="flex items-center justify-between">
            <div>
              <p class="text-2xl font-bold">{{ stats?.publishedAnnouncements ?? 0 }}</p>
              <p class="text-xs text-muted-foreground">Anuncios</p>
            </div>
            <div class="flex size-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
              <Megaphone class="size-5 text-cyan-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Proveedores -->
      <Card>
        <CardContent class="p-4">
          <template v-if="isLoading">
            <div class="flex items-center justify-between">
              <div class="space-y-2">
                <Skeleton class="h-7 w-10" />
                <Skeleton class="h-3 w-24" />
              </div>
              <Skeleton class="size-10 rounded-lg" />
            </div>
          </template>
          <div v-else class="flex items-center justify-between">
            <div>
              <p class="text-2xl font-bold">{{ stats?.activeProviders ?? 0 }}</p>
              <p class="text-xs text-muted-foreground">Proveedores</p>
            </div>
            <div class="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Wrench class="size-5 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Reuniones Proximas -->
      <Card>
        <CardContent class="p-4">
          <template v-if="isLoading">
            <div class="flex items-center justify-between">
              <div class="space-y-2">
                <Skeleton class="h-7 w-10" />
                <Skeleton class="h-3 w-24" />
              </div>
              <Skeleton class="size-10 rounded-lg" />
            </div>
          </template>
          <div v-else class="flex items-center justify-between">
            <div>
              <p class="text-2xl font-bold">{{ stats?.upcomingMeetings ?? 0 }}</p>
              <p class="text-xs text-muted-foreground">Reuniones Proximas</p>
            </div>
            <div class="flex size-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Calendar class="size-5 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Next Meeting -->
    <Card v-if="stats?.nextMeeting" class="mt-4">
      <CardContent class="p-4">
        <p class="text-xs font-medium text-muted-foreground">Proxima reunion</p>
        <p class="mt-1 text-sm font-medium">{{ stats.nextMeeting.title }}</p>
        <p class="mt-0.5 text-xs text-muted-foreground">
          {{ formatDate(stats.nextMeeting.date) }}
        </p>
      </CardContent>
    </Card>
  </div>
</template>
