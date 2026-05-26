<script setup lang="ts">
import {
  AlertTriangle,
  Calendar,
  CircleCheck,
  ClipboardList,
  MessageCircle,
  QrCode,
  Receipt,
  UserPlus,
  Users,
  Vote,
} from 'lucide-vue-next'
import { buttonVariants } from '~/components/ui/button'
import { ICON_BG } from '~/composables/useColorMap'

useHead({ title: 'Mi Vivienda' })

const { stats, isLoading } = useDashboard()
const { formatCurrency, formatDateTime } = useFormatDate()

const quickActions = [
  { label: 'Nueva Visita', to: '/propietario/nueva-visita', icon: UserPlus, bg: ICON_BG.teal },
  { label: 'Reportar Incidencia', to: '/propietario/incidencias', icon: ClipboardList, bg: ICON_BG.warning },
  { label: 'Estado de Cuenta', to: '/propietario/estado-cuenta', icon: Receipt, bg: ICON_BG.success },
  { label: 'Chat', to: '/mi-chana/chat', icon: MessageCircle, bg: ICON_BG.purple },
] as const
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- 1. Hero financiero -->
    <Card class="p-6">
      <template v-if="isLoading">
        <div class="flex items-center gap-4">
          <Skeleton class="size-10 rounded-lg" />
          <div class="flex flex-col gap-2">
            <Skeleton class="h-4 w-28" />
            <Skeleton class="h-7 w-36" />
          </div>
        </div>
      </template>

      <template v-else-if="stats?.myIsInDebt">
        <div class="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-950/20 dark:ring-amber-800">
          <div class="flex items-center gap-4">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle class="size-5 text-amber-600" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm text-muted-foreground">Saldo pendiente</p>
              <p class="text-2xl font-bold tabular-nums tracking-tight text-amber-600">
                {{ formatCurrency(stats.myBalance ?? 0) }}
              </p>
            </div>
          </div>
          <NuxtLink
            to="/propietario/estado-cuenta"
            class="mt-3 inline-block text-sm text-amber-600 hover:underline"
          >
            Ver estado de cuenta &rarr;
          </NuxtLink>
        </div>
      </template>

      <template v-else>
        <div class="rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-200 dark:bg-emerald-950/20 dark:ring-emerald-800">
          <div class="flex items-center gap-4">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CircleCheck class="size-5 text-emerald-600" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-lg font-semibold text-emerald-600">Estás al día</p>
              <p class="text-sm text-muted-foreground">No tienes saldos pendientes</p>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- 2. Mi QR — Botón prominente -->
    <NuxtLink
      to="/propietario/mi-qr"
      :class="buttonVariants({ variant: 'default', size: 'lg' })"
      class="w-full h-14 gap-3 text-base font-semibold"
    >
      <QrCode class="size-6" />
      Mi QR de Acceso
    </NuxtLink>

    <!-- 3. Stat cards — unified on mobile, separate on sm+ -->
    <div class="hidden sm:grid sm:grid-cols-3 sm:gap-4">
      <StatCard
        label="Mis Incidencias"
        :value="stats?.myOpenIncidents ?? 0"
        :icon="AlertTriangle"
        :icon-bg-class="ICON_BG.warning"
        :is-loading="isLoading"
      />
      <StatCard
        label="Votaciones"
        :value="stats?.activePolls ?? 0"
        :icon="Vote"
        :icon-bg-class="ICON_BG.purple"
        :is-loading="isLoading"
      />
      <StatCard
        label="Visitas Activas"
        :value="stats?.myActiveVisits ?? 0"
        :icon="Users"
        :icon-bg-class="ICON_BG.info"
        :is-loading="isLoading"
      />
    </div>
    <Card class="sm:hidden">
      <CardContent class="flex items-center divide-x p-0">
        <div v-for="(stat, idx) in [
          { label: 'Incidencias', value: stats?.myOpenIncidents ?? 0, icon: AlertTriangle, bg: ICON_BG.warning },
          { label: 'Votaciones', value: stats?.activePolls ?? 0, icon: Vote, bg: ICON_BG.purple },
          { label: 'Visitas', value: stats?.myActiveVisits ?? 0, icon: Users, bg: ICON_BG.info },
        ]" :key="idx" class="flex flex-1 flex-col items-center gap-1 py-3">
          <template v-if="isLoading">
            <Skeleton class="size-6 rounded-lg" />
            <Skeleton class="h-4 w-10" />
          </template>
          <template v-else>
            <div class="flex size-7 items-center justify-center rounded-lg" :class="stat.bg">
              <component :is="stat.icon" class="size-3.5" />
            </div>
            <p class="text-lg font-bold tabular-nums">{{ stat.value }}</p>
            <p class="text-[11px] text-muted-foreground">{{ stat.label }}</p>
          </template>
        </div>
      </CardContent>
    </Card>

    <!-- 4. Quick actions -->
    <div>
      <h2 class="mb-3 text-sm font-semibold text-muted-foreground">Acciones rápidas</h2>
      <div class="grid grid-cols-2 gap-3">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
          :class="buttonVariants({ variant: 'outline', size: 'lg' })"
          class="h-auto flex-col gap-2 py-3.5 sm:gap-2.5 sm:py-5"
        >
          <div class="flex size-10 items-center justify-center rounded-lg" :class="action.bg">
            <component :is="action.icon" class="size-5" />
          </div>
          <span class="text-sm font-medium">{{ action.label }}</span>
        </NuxtLink>
      </div>
    </div>

    <!-- 5. Próxima reunión -->
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
