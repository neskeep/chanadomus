<script setup lang="ts">
import {
  AlertTriangle,
  Building2,
  Calendar,
  ClipboardList,
  Megaphone,
  MessageCircle,
  ScanLine,
  Vote,
} from 'lucide-vue-next'
import { buttonVariants } from '~/components/ui/button'
import { ICON_BG } from '~/composables/useColorMap'

useHead({ title: 'Mi Vivienda' })

const { formatDateTime } = useFormatDate()

interface DashboardStats {
  myOpenIncidents: number
  activePolls: number
  publishedAnnouncements: number
  upcomingMeetings: number
  nextMeeting: { title: string; date: string } | null
}

const stats = ref<DashboardStats | null>(null)
const isLoading = ref(true)

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

const quickActions = [
  { label: 'Mi Unidad', to: '/propietario/mi-unidad', icon: Building2 },
  { label: 'Mi QR', to: '/propietario/mi-qr', icon: ScanLine },
  { label: 'Reportar Incidencia', to: '/propietario/incidencias', icon: ClipboardList },
  { label: 'Ver Cartelera', to: '/mi-chana/cartelera', icon: Megaphone },
  { label: 'Votaciones', to: '/mi-chana/votaciones', icon: Vote },
  { label: 'Chat', to: '/mi-chana/chat', icon: MessageCircle },
] as const
</script>

<template>
  <div class="space-y-8">
    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Stat cards -->
      <Card class="p-4">
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-1">
            <template v-if="isLoading">
              <Skeleton class="h-5 w-16" />
              <Skeleton class="h-8 w-12" />
            </template>
            <template v-else>
              <p class="text-sm text-muted-foreground">Mis Incidencias</p>
              <p class="text-2xl font-bold tabular-nums tracking-tight">{{ stats?.myOpenIncidents ?? 0 }}</p>
            </template>
          </div>
          <div :class="['flex size-10 items-center justify-center rounded-lg', ICON_BG.warning]">
            <AlertTriangle class="size-5" />
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-1">
            <template v-if="isLoading">
              <Skeleton class="h-5 w-16" />
              <Skeleton class="h-8 w-12" />
            </template>
            <template v-else>
              <p class="text-sm text-muted-foreground">Votaciones Activas</p>
              <p class="text-2xl font-bold tabular-nums tracking-tight">{{ stats?.activePolls ?? 0 }}</p>
            </template>
          </div>
          <div :class="['flex size-10 items-center justify-center rounded-lg', ICON_BG.purple]">
            <Vote class="size-5" />
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-1">
            <template v-if="isLoading">
              <Skeleton class="h-5 w-16" />
              <Skeleton class="h-8 w-12" />
            </template>
            <template v-else>
              <p class="text-sm text-muted-foreground">Anuncios</p>
              <p class="text-2xl font-bold tabular-nums tracking-tight">{{ stats?.publishedAnnouncements ?? 0 }}</p>
            </template>
          </div>
          <div :class="['flex size-10 items-center justify-center rounded-lg', ICON_BG.info]">
            <Megaphone class="size-5" />
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-1">
            <template v-if="isLoading">
              <Skeleton class="h-5 w-16" />
              <Skeleton class="h-8 w-12" />
            </template>
            <template v-else>
              <p class="text-sm text-muted-foreground">Reuniones</p>
              <p class="text-2xl font-bold tabular-nums tracking-tight">{{ stats?.upcomingMeetings ?? 0 }}</p>
            </template>
          </div>
          <div :class="['flex size-10 items-center justify-center rounded-lg', ICON_BG.success]">
            <Calendar class="size-5" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Next Meeting -->
    <Card v-if="stats?.nextMeeting" class="p-4">
      <div class="flex items-center gap-3">
        <div :class="['flex size-10 shrink-0 items-center justify-center rounded-lg', ICON_BG.success]">
          <Calendar class="size-5" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-muted-foreground">Próxima reunión</p>
          <p class="truncate text-base font-semibold">{{ stats.nextMeeting.title }}</p>
          <p class="text-sm text-muted-foreground">{{ formatDateTime(stats.nextMeeting.date) }}</p>
        </div>
      </div>
    </Card>

    <!-- Quick Actions -->
    <div>
      <h2 class="mb-3 text-sm font-semibold text-muted-foreground">Acciones rápidas</h2>
      <div class="grid grid-cols-2 gap-3">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
          :class="buttonVariants({ variant: 'outline', size: 'lg' })"
          class="h-auto flex-col gap-2.5 py-5"
        >
          <component :is="action.icon" class="size-6 text-primary" />
          <span class="text-sm font-medium">{{ action.label }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
