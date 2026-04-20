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
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
  cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30',
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
    <div class="mt-4 grid grid-cols-2 gap-2">
      <div
        v-for="(card, i) in statCards"
        :key="i"
        class="flex items-center gap-3 rounded-lg border bg-card p-3"
      >
        <div class="flex size-8 shrink-0 items-center justify-center rounded-md" :class="colorMap[card.color]">
          <component :is="card.icon" class="size-4" />
        </div>
        <div v-if="isLoading" class="space-y-1">
          <Skeleton class="h-5 w-8" />
          <Skeleton class="h-3 w-16" />
        </div>
        <div v-else>
          <p class="text-lg font-bold leading-none">{{ card.value }}</p>
          <p class="mt-0.5 text-[11px] text-muted-foreground">{{ card.label }}</p>
        </div>
      </div>
    </div>

    <div v-if="stats?.nextMeeting" class="mt-3 rounded-lg border bg-card p-3">
      <p class="text-[11px] font-medium text-muted-foreground">Proxima reunion</p>
      <p class="mt-0.5 text-sm font-medium">{{ stats.nextMeeting.title }}</p>
      <p class="text-[11px] text-muted-foreground">{{ formatDate(stats.nextMeeting.date) }}</p>
    </div>
  </div>
</template>
