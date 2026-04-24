<script setup lang="ts">
import { AlertTriangle, Calendar, Megaphone, Shield } from 'lucide-vue-next'

definePageMeta({ layout: 'default', title: 'Panel Vigilancia' })

const { user } = useAuth()

interface DashboardStats {
  openIncidents: number
  todayAccessCount: number
  publishedAnnouncements: number
  upcomingMeetings: number
  nextMeeting: { title: string; date: string } | null
}

const stats = ref<DashboardStats | null>(null)
const isLoading = ref(true)

const statCards = computed(() => [
  { label: 'Accesos Hoy', value: stats.value?.todayAccessCount ?? 0, icon: Shield, color: 'blue' },
  { label: 'Incidencias Abiertas', value: stats.value?.openIncidents ?? 0, icon: AlertTriangle, color: 'amber' },
  { label: 'Anuncios', value: stats.value?.publishedAnnouncements ?? 0, icon: Megaphone, color: 'cyan' },
  { label: 'Reuniones Proximas', value: stats.value?.upcomingMeetings ?? 0, icon: Calendar, color: 'emerald' },
])

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600',
  amber: 'bg-amber-100 text-amber-600',
  cyan: 'bg-cyan-100 text-cyan-600',
  emerald: 'bg-emerald-100 text-emerald-600',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-VE', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })
}

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
        Hola, {{ user?.name?.split(' ')[0] || 'Operador' }}
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Aqui tienes el resumen del dia
      </p>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="(card, i) in statCards"
        :key="i"
        class="flex items-center gap-3 rounded-lg border bg-card p-4"
      >
        <div class="flex size-10 shrink-0 items-center justify-center rounded-md" :class="colorMap[card.color]">
          <component :is="card.icon" class="size-5" />
        </div>
        <div v-if="isLoading" class="space-y-1">
          <Skeleton class="h-5 w-8" />
          <Skeleton class="h-3 w-16" />
        </div>
        <div v-else>
          <p class="text-2xl font-bold leading-none">{{ card.value }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">{{ card.label }}</p>
        </div>
      </div>
    </div>

    <div v-if="stats?.nextMeeting" class="mt-4 rounded-lg border border-l-4 border-l-primary bg-card p-4">
      <div class="flex items-center gap-1.5">
        <Calendar class="size-4 text-muted-foreground" />
        <p class="text-xs text-muted-foreground">Proxima reunion</p>
      </div>
      <p class="mt-0.5 text-base font-semibold">{{ stats.nextMeeting.title }}</p>
      <p class="text-xs text-muted-foreground">{{ formatDate(stats.nextMeeting.date) }}</p>
    </div>
  </div>
</template>
