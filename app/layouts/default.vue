<script setup lang="ts">
import { LogOut, Home, Wallet, AlertTriangle, Building2, Users, Shield, MessageCircle, Megaphone, Vote, Bell, Wrench, Calendar } from 'lucide-vue-next'
import { ROLE_LABELS, ROLE_REDIRECTS } from '~~/shared/types/auth'
import type { UserRole } from '~~/shared/types/auth'

const { user, role, signOut } = useAuth()

const roleLabel = computed(() => role.value ? ROLE_LABELS[role.value] : '')
const roleHome = computed(() => role.value ? ROLE_REDIRECTS[role.value] : '/')

const navItems = computed(() => {
  const base = [
    { label: 'Inicio', icon: Home, to: roleHome.value },
  ]
  if (role.value === 'admin') {
    base.push({ label: 'Finanzas', icon: Wallet, to: '/admin/finanzas' })
    base.push({ label: 'Incidencias', icon: AlertTriangle, to: '/admin/incidencias' })
    base.push({ label: 'Unidades', icon: Building2, to: '/admin/unidades' })
    base.push({ label: 'Personal', icon: Users, to: '/admin/personal' })
    base.push({ label: 'Cartelera', icon: Megaphone, to: '/admin/cartelera' })
    base.push({ label: 'Votaciones', icon: Vote, to: '/admin/votaciones' })
    base.push({ label: 'Proveedores', icon: Wrench, to: '/admin/proveedores' })
    base.push({ label: 'Reuniones', icon: Calendar, to: '/admin/reuniones' })
    base.push({ label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' })
  }
  if (role.value === 'propietario') {
    base.push({ label: 'Informes', icon: Wallet, to: '/propietario/informes' })
    base.push({ label: 'Incidencias', icon: AlertTriangle, to: '/propietario/incidencias' })
    base.push({ label: 'Cartelera', icon: Megaphone, to: '/mi-chana/cartelera' })
    base.push({ label: 'Votaciones', icon: Vote, to: '/mi-chana/votaciones' })
    base.push({ label: 'Proveedores', icon: Wrench, to: '/mi-chana/proveedores' })
    base.push({ label: 'Reuniones', icon: Calendar, to: '/mi-chana/reuniones' })
    base.push({ label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' })
  }
  if (role.value === 'vigilancia') {
    base.push({ label: 'Residentes', icon: Shield, to: '/vigilancia/residentes' })
    base.push({ label: 'Cartelera', icon: Megaphone, to: '/mi-chana/cartelera' })
    base.push({ label: 'Proveedores', icon: Wrench, to: '/mi-chana/proveedores' })
    base.push({ label: 'Reuniones', icon: Calendar, to: '/mi-chana/reuniones' })
    base.push({ label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' })
  }
  if (role.value === 'conserje') {
    base.push({ label: 'Cartelera', icon: Megaphone, to: '/mi-chana/cartelera' })
    base.push({ label: 'Proveedores', icon: Wrench, to: '/mi-chana/proveedores' })
    base.push({ label: 'Reuniones', icon: Calendar, to: '/mi-chana/reuniones' })
    base.push({ label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' })
  }
  return base
})
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background">
    <!-- Top bar -->
    <header class="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <span class="text-sm font-semibold tracking-tight text-primary">ChanaDomus</span>
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted-foreground">{{ roleLabel }}</span>
        <NuxtLink to="/mi-chana/notificaciones">
          <Button variant="ghost" size="icon" class="size-8">
            <Bell class="size-4" />
          </Button>
        </NuxtLink>
        <Button variant="ghost" size="icon" class="size-8" @click="signOut">
          <LogOut class="size-4" />
        </Button>
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1 px-4 py-6">
      <slot />
    </main>

    <!-- Panic button (floating, above bottom nav) -->
    <div class="fixed bottom-20 right-4 z-50 flex flex-col items-center md:bottom-6">
      <PanicButton />
    </div>

    <!-- Bottom nav (mobile) -->
    <nav class="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-1 text-muted-foreground transition-colors [&.router-link-active]:text-primary"
      >
        <component :is="item.icon" class="size-5" />
        <span class="text-[10px] font-medium">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Bottom nav spacer on mobile -->
    <div class="h-16 md:hidden" />
  </div>
</template>
