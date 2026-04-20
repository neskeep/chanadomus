<script setup lang="ts">
import {
  LogOut, Home, Wallet, AlertTriangle, Building2, Users, Shield,
  MessageCircle, Megaphone, Vote, Bell, Wrench, Calendar, MoreHorizontal,
} from 'lucide-vue-next'
import { ROLE_LABELS, ROLE_REDIRECTS } from '~~/shared/types/auth'

const { user, role, signOut } = useAuth()

const roleLabel = computed(() => role.value ? ROLE_LABELS[role.value] : '')
const roleHome = computed(() => role.value ? ROLE_REDIRECTS[role.value] : '/')

const moreOpen = ref(false)
const route = useRoute()

// Close sheet on navigation
watch(() => route.path, () => {
  moreOpen.value = false
})

// Primary items shown in bottom nav (max 5 including "Más")
const primaryItems = computed(() => {
  const base = [
    { label: 'Inicio', icon: Home, to: roleHome.value },
  ]
  if (role.value === 'admin') {
    base.push({ label: 'Finanzas', icon: Wallet, to: '/admin/finanzas' })
    base.push({ label: 'Incidencias', icon: AlertTriangle, to: '/admin/incidencias' })
    base.push({ label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' })
  }
  if (role.value === 'propietario') {
    base.push({ label: 'Informes', icon: Wallet, to: '/propietario/informes' })
    base.push({ label: 'Incidencias', icon: AlertTriangle, to: '/propietario/incidencias' })
    base.push({ label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' })
  }
  if (role.value === 'vigilancia') {
    base.push({ label: 'Residentes', icon: Shield, to: '/vigilancia/residentes' })
    base.push({ label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' })
    base.push({ label: 'Reuniones', icon: Calendar, to: '/mi-chana/reuniones' })
  }
  if (role.value === 'conserje') {
    base.push({ label: 'Cartelera', icon: Megaphone, to: '/mi-chana/cartelera' })
    base.push({ label: 'Proveedores', icon: Wrench, to: '/mi-chana/proveedores' })
    base.push({ label: 'Reuniones', icon: Calendar, to: '/mi-chana/reuniones' })
    base.push({ label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' })
  }
  return base
})

// Secondary items shown in "Más" sheet
const secondaryItems = computed(() => {
  if (role.value === 'admin') {
    return [
      { label: 'Unidades', icon: Building2, to: '/admin/unidades' },
      { label: 'Personal', icon: Users, to: '/admin/personal' },
      { label: 'Cartelera', icon: Megaphone, to: '/admin/cartelera' },
      { label: 'Votaciones', icon: Vote, to: '/admin/votaciones' },
      { label: 'Proveedores', icon: Wrench, to: '/admin/proveedores' },
      { label: 'Reuniones', icon: Calendar, to: '/admin/reuniones' },
    ]
  }
  if (role.value === 'propietario') {
    return [
      { label: 'Cartelera', icon: Megaphone, to: '/mi-chana/cartelera' },
      { label: 'Votaciones', icon: Vote, to: '/mi-chana/votaciones' },
      { label: 'Proveedores', icon: Wrench, to: '/mi-chana/proveedores' },
      { label: 'Reuniones', icon: Calendar, to: '/mi-chana/reuniones' },
    ]
  }
  if (role.value === 'vigilancia') {
    return [
      { label: 'Cartelera', icon: Megaphone, to: '/mi-chana/cartelera' },
      { label: 'Proveedores', icon: Wrench, to: '/mi-chana/proveedores' },
    ]
  }
  return []
})

const hasMore = computed(() => secondaryItems.value.length > 0)

// Check if current route matches any secondary item (to highlight "Más" icon)
const isSecondaryActive = computed(() =>
  secondaryItems.value.some(item => route.path.startsWith(item.to)),
)
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background">
    <!-- Top bar -->
    <header class="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div>
        <span class="text-sm font-semibold tracking-tight">{{ user?.name }}</span>
        <span class="ml-1.5 text-xs text-muted-foreground">{{ roleLabel }}</span>
      </div>
      <div class="flex items-center gap-1">
        <PanicButton />
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

    <!-- Bottom nav (mobile) -->
    <nav class="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <NuxtLink
        v-for="item in primaryItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-1 text-muted-foreground transition-colors [&.router-link-active]:text-primary"
      >
        <component :is="item.icon" class="size-5" />
        <span class="text-[10px] font-medium">{{ item.label }}</span>
      </NuxtLink>

      <!-- "Más" button -->
      <button
        v-if="hasMore"
        class="flex flex-col items-center gap-1 transition-colors"
        :class="isSecondaryActive ? 'text-primary' : 'text-muted-foreground'"
        @click="moreOpen = true"
      >
        <MoreHorizontal class="size-5" />
        <span class="text-[10px] font-medium">Más</span>
      </button>
    </nav>

    <!-- "Más" Sheet -->
    <Sheet v-model:open="moreOpen">
      <SheetContent side="bottom" class="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Más opciones</SheetTitle>
        </SheetHeader>
        <div class="grid grid-cols-3 gap-4 py-6">
          <NuxtLink
            v-for="item in secondaryItems"
            :key="item.to"
            :to="item.to"
            class="flex flex-col items-center gap-2 rounded-xl p-3 text-muted-foreground transition-colors hover:bg-muted [&.router-link-active]:bg-primary/10 [&.router-link-active]:text-primary"
          >
            <component :is="item.icon" class="size-6" />
            <span class="text-xs font-medium">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Bottom nav spacer on mobile -->
    <div class="h-16 md:hidden" />
  </div>
</template>
