<script setup lang="ts">
import { AlertTriangle, Calendar, ClipboardList, DoorOpen, QrCode, Shield, Store, Wrench } from 'lucide-vue-next'
import { buttonVariants } from '~/components/ui/button'
import { ICON_BG } from '~/composables/useColorMap'

useHead({ title: 'Panel Conserjería' })

const { stats, isLoading } = useDashboard()
const { formatDateTime } = useFormatDate()

const quickActions = [
  { label: 'Reportar Incidencia', to: '/conserje/incidencias/nueva', icon: ClipboardList },
  { label: 'Proveedores', to: '/mi-chana/proveedores', icon: Store },
  { label: 'Registrar Acceso', to: '/conserje/registrar-acceso', icon: DoorOpen },
]
</script>

<template>
  <div class="space-y-8">
    <!-- Stat cards -->
    <div class="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      <StatCard
        label="Accesos Hoy"
        :value="stats?.todayAccessCount ?? 0"
        :icon="Shield"
        :icon-bg-class="ICON_BG.info"
        :is-loading="isLoading"
      />
      <StatCard
        label="Incidencias Abiertas"
        :value="stats?.openIncidents ?? 0"
        :icon="AlertTriangle"
        :icon-bg-class="ICON_BG.warning"
        :is-loading="isLoading"
      />
      <StatCard
        label="Proveedores"
        :value="stats?.activeProviders ?? 0"
        :icon="Wrench"
        :icon-bg-class="ICON_BG.success"
        :is-loading="isLoading"
      />
    </div>

    <!-- Mi QR — Botón prominente -->
    <NuxtLink
      to="/conserje/mi-qr"
      :class="buttonVariants({ variant: 'default', size: 'lg' })"
      class="w-full h-14 gap-3 text-base font-semibold"
    >
      <QrCode class="size-6" />
      Mi QR de Acceso
    </NuxtLink>

    <!-- Quick actions -->
    <div>
      <h2 class="mb-3 text-sm font-semibold text-muted-foreground">Acciones rápidas</h2>
      <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
        >
          <Button
            variant="outline"
            size="lg"
            class="flex h-auto w-full flex-col gap-2.5 py-5"
          >
            <component :is="action.icon" class="size-6 text-primary" />
            <span class="text-sm font-medium">{{ action.label }}</span>
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
