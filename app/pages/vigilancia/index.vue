<script setup lang="ts">
import { AlertTriangle, ClipboardList, DoorOpen, LogIn, LogOut, QrCode, Shield, ShieldAlert, UserPlus, Users } from 'lucide-vue-next'
import { buttonVariants } from '~/components/ui/button'
import { ICON_BG } from '~/composables/useColorMap'

useHead({ title: 'Panel Vigilancia' })

const { stats, isLoading } = useDashboard()
const { events, isConnected, loadInitialEvents } = useAccessStream()
const { hasActiveAlert, activeAlert } = usePanicStream()

const quickActions = [
  { label: 'Registrar', icon: DoorOpen, to: '/vigilancia/registrar-acceso' },
  { label: 'Incidencias', icon: ClipboardList, to: '/vigilancia/incidencias' },
  { label: 'Residentes', icon: Users, to: '/vigilancia/residentes' },
] as const

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

onMounted(() => {
  loadInitialEvents()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 0. Panic alert banner -->
    <NuxtLink v-if="hasActiveAlert" to="/vigilancia/alertas">
      <Card class="animate-pulse border-destructive bg-destructive/10">
        <CardContent class="flex items-center gap-3 px-4 py-3">
          <ShieldAlert class="size-6 text-destructive" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-destructive">ALERTA DE PANICO</p>
            <p class="truncate text-xs text-destructive/80">
              {{ activeAlert?.userName }} — {{ activeAlert?.unitLabel || activeAlert?.unitNumber }}
            </p>
          </div>
          <Badge variant="destructive" class="shrink-0 animate-bounce">
            Ver
          </Badge>
        </CardContent>
      </Card>
    </NuxtLink>

    <!-- 1. Hero: Accesos Hoy -->
    <Card class="p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-muted-foreground">Accesos Hoy</p>
          <template v-if="isLoading">
            <Skeleton class="mt-2 h-12 w-20" />
            <Skeleton class="mt-1.5 h-4 w-32" />
          </template>
          <template v-else>
            <p class="mt-1 text-4xl font-bold tabular-nums tracking-tight">
              {{ stats?.todayAccessCount ?? 0 }}
            </p>
            <p class="mt-0.5 text-sm text-muted-foreground">
              {{ stats?.todayEntryCount ?? 0 }} entradas · {{ stats?.todayExitCount ?? 0 }} salidas
            </p>
          </template>
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

    <!-- 2. Acciones principales: Escanear QR + Registrar Acceso -->
    <div class="grid grid-cols-2 gap-3">
      <NuxtLink
        to="/vigilancia/escanear"
        :class="buttonVariants({ variant: 'default', size: 'lg' })"
        class="h-14 gap-2.5 text-base font-semibold"
      >
        <QrCode class="size-5" />
        Escanear QR
      </NuxtLink>
      <NuxtLink
        to="/vigilancia/registrar-acceso"
        :class="buttonVariants({ variant: 'outline', size: 'lg' })"
        class="h-14 gap-2.5 text-base font-semibold"
      >
        <UserPlus class="size-5" />
        Registrar
      </NuxtLink>
    </div>

    <!-- 3. Feed en vivo: Últimos accesos -->
    <Card class="p-5">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-sm font-semibold">Accesos recientes</h2>
        <Badge v-if="isConnected" variant="secondary" class="gap-1.5">
          <span class="relative flex size-2">
            <span class="absolute inline-flex size-full animate-ping rounded-lg bg-emerald-400 opacity-75" />
            <span class="relative inline-flex size-2 rounded-lg bg-emerald-500" />
          </span>
          En vivo
        </Badge>
      </div>

      <div v-if="events.length > 0" class="divide-y divide-border">
        <div
          v-for="event in events.slice(0, 5)"
          :key="event.id"
          class="flex items-center gap-3 py-2.5"
        >
          <LogOut v-if="event.exitAt" class="size-5 shrink-0 text-muted-foreground" />
          <LogIn v-else class="size-5 shrink-0 text-emerald-500" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ event.visitorName || 'Sin nombre' }}</p>
            <p class="text-xs text-muted-foreground">{{ event.unitLabel || event.unitNumber }}</p>
          </div>
          <span class="shrink-0 text-xs tabular-nums text-muted-foreground">
            {{ timeAgo(event.createdAt) }}
          </span>
        </div>
      </div>
      <p v-else class="py-8 text-center text-sm text-muted-foreground">
        Sin accesos registrados hoy
      </p>

      <div class="mt-4">
        <NuxtLink to="/vigilancia/accesos" class="text-sm text-primary hover:underline">
          Ver todos los accesos →
        </NuxtLink>
      </div>
    </Card>

    <!-- 4. Stat cards -->
    <div class="grid grid-cols-2 gap-4">
      <StatCard
        label="Incidencias Abiertas"
        :value="stats?.openIncidents ?? 0"
        :icon="AlertTriangle"
        :icon-bg-class="ICON_BG.warning"
        :is-loading="isLoading"
      />
      <StatCard
        label="Alertas Pendientes"
        :value="stats?.unresolvedPanicCount ?? 0"
        :icon="ShieldAlert"
        :icon-bg-class="ICON_BG.danger"
        :is-loading="isLoading"
      />
    </div>

    <!-- 5. Quick actions -->
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
            class="flex h-auto min-h-16 w-full flex-col gap-2 px-2 py-4"
          >
            <component :is="action.icon" class="size-5 text-primary" />
            <span class="text-center text-[11px] font-medium leading-tight sm:text-xs">{{ action.label }}</span>
          </Button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
