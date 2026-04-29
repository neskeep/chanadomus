<script setup lang="ts">
import { Calendar, ClipboardList, Megaphone, Shield, Store, Wrench } from 'lucide-vue-next'
import { ICON_BG } from '~/composables/useColorMap'

useHead({ title: 'Panel Conserjería' })

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


const quickActions = [
  { label: 'Registrar Acceso', to: '/vigilancia/accesos', icon: ClipboardList },
  { label: 'Proveedores', to: '/mi-chana/proveedores', icon: Store },
  { label: 'Cartelera', to: '/mi-chana/cartelera', icon: Megaphone },
]

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
    <!-- Stats grid -->
    <div class="grid grid-cols-2 gap-4">
      <Card class="p-4">
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-1">
            <template v-if="isLoading">
              <Skeleton class="h-5 w-16" />
              <Skeleton class="h-8 w-12" />
            </template>
            <template v-else>
              <p class="text-sm text-muted-foreground">Accesos Hoy</p>
              <p class="text-2xl font-bold tabular-nums tracking-tight">{{ stats?.todayAccessCount ?? 0 }}</p>
            </template>
          </div>
          <div :class="['flex size-10 items-center justify-center rounded-lg', ICON_BG.info]">
            <Shield class="size-5" />
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
              <p class="text-sm text-muted-foreground">Proveedores</p>
              <p class="text-2xl font-bold tabular-nums tracking-tight">{{ stats?.activeProviders ?? 0 }}</p>
            </template>
          </div>
          <div :class="['flex size-10 items-center justify-center rounded-lg', ICON_BG.success]">
            <Wrench class="size-5" />
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
          <div :class="['flex size-10 items-center justify-center rounded-lg', ICON_BG.purple]">
            <Calendar class="size-5" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Quick Actions -->
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
            class="flex h-auto min-h-14 w-full flex-col gap-2 py-4"
          >
            <component :is="action.icon" class="size-5 text-primary" />
            <span class="text-xs font-medium">{{ action.label }}</span>
          </Button>
        </NuxtLink>
      </div>
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
  </div>
</template>
