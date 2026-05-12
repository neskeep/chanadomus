<script setup lang="ts">
import { AlertTriangle, Calendar, DoorOpen, Megaphone, QrCode, Shield, Users } from 'lucide-vue-next'
import { ICON_BG } from '~/composables/useColorMap'

useHead({ title: 'Panel Vigilancia' })

const { formatDateTime } = useFormatDate()

interface DashboardStats {
  openIncidents: number
  todayAccessCount: number
  publishedAnnouncements: number
  upcomingMeetings: number
  nextMeeting: { title: string; date: string } | null
}

const stats = ref<DashboardStats | null>(null)
const isLoading = ref(true)


const quickActions = [
  { label: 'Registrar Acceso', icon: DoorOpen, to: '/vigilancia/accesos' },
  { label: 'Escanear QR', icon: QrCode, to: '/vigilancia/escanear' },
  { label: 'Residentes', icon: Users, to: '/vigilancia/residentes' },
] as const

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
  <div class="space-y-8">
    <!-- Hero: Accesos Hoy -->
    <Card class="p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-muted-foreground">Accesos Hoy</p>
          <template v-if="isLoading">
            <Skeleton class="mt-2 h-12 w-20" />
          </template>
          <p v-else class="mt-1 text-4xl font-bold tabular-nums tracking-tight">
            {{ stats?.todayAccessCount ?? 0 }}
          </p>
        </div>
        <div class="flex flex-col items-end gap-3">
          <div :class="['flex size-12 items-center justify-center rounded-lg', ICON_BG.teal]">
            <Shield class="size-6" />
          </div>
          <Badge variant="secondary" class="gap-1.5">
            <span class="relative flex size-2">
              <span class="absolute inline-flex size-full animate-ping rounded-lg bg-emerald-400 opacity-75" />
              <span class="relative inline-flex size-2 rounded-lg bg-emerald-500" />
            </span>
            En vivo
          </Badge>
        </div>
      </div>
    </Card>

    <!-- Stats grid -->
    <div class="grid grid-cols-3 gap-4">
      <Card class="p-4">
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-1">
            <template v-if="isLoading">
              <Skeleton class="h-5 w-16" />
              <Skeleton class="h-8 w-12" />
            </template>
            <template v-else>
              <p class="text-sm text-muted-foreground">Incidencias</p>
              <p class="text-2xl font-bold tabular-nums tracking-tight">{{ stats?.openIncidents ?? 0 }}</p>
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
              <p class="text-sm text-muted-foreground">Anuncios</p>
              <p class="text-2xl font-bold tabular-nums tracking-tight">{{ stats?.publishedAnnouncements ?? 0 }}</p>
            </template>
          </div>
          <div :class="['flex size-10 items-center justify-center rounded-lg', ICON_BG.teal]">
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

    <!-- Quick actions -->
    <div>
      <h2 class="mb-3 text-sm font-semibold text-muted-foreground">Acciones rápidas</h2>
      <div class="grid grid-cols-3 gap-3">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
        >
          <Button
            variant="outline"
            size="lg"
            class="flex h-auto min-h-16 w-full flex-col gap-2 py-4"
          >
            <component :is="action.icon" class="size-5 text-primary" />
            <span class="text-xs font-medium leading-tight">{{ action.label }}</span>
          </Button>
        </NuxtLink>
      </div>
    </div>

    <!-- Next meeting -->
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
  </div>
</template>
