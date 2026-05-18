<script setup lang="ts">
import { MoreHorizontal, LogOut } from 'lucide-vue-next'
import { ROLE_LABELS } from '~~/shared/types/auth'

const { mobileItems, groups } = useNavigation()
const { user, role, signOut } = useAuth()
const route = useRoute()
const { hasActiveAlert } = usePanicStream()

const moreOpen = ref(false)

const roleLabel = computed(() => role.value ? ROLE_LABELS[role.value] : '')

const initials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

// Groups filtered: exclude items already in bottom nav
const secondaryGroups = computed(() => {
  const mobilePaths = new Set(mobileItems.value.map(i => i.to))
  return groups.value
    .map(g => ({
      label: g.label,
      items: g.items.filter(item => !mobilePaths.has(item.to)),
    }))
    .filter(g => g.items.length > 0)
})

watch(() => route.path, () => {
  moreOpen.value = false
})
</script>

<template>
  <nav
    aria-label="Navegacion principal"
    class="fixed bottom-0 left-0 right-0 z-40 flex items-end justify-around border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
  >
    <NuxtLink
      v-for="item in mobileItems"
      :key="item.to"
      :to="item.to"
      class="relative flex min-w-[3.5rem] flex-col items-center gap-1 px-3 py-2.5 text-muted-foreground transition-colors"
      active-class="!text-primary"
    >
      <component :is="item.icon" class="size-5" />
      <span class="text-[11px] font-medium">{{ item.label }}</span>
    </NuxtLink>

    <button
      class="relative flex min-w-[3.5rem] flex-col items-center gap-1 px-3 py-2.5 transition-colors"
      :class="moreOpen ? 'text-primary' : 'text-muted-foreground'"
      @click="moreOpen = true"
    >
      <MoreHorizontal class="size-5" />
      <span class="text-[11px] font-medium">Más</span>
    </button>

    <Sheet v-model:open="moreOpen">
      <SheetContent side="bottom" class="rounded-t-lg px-0 pb-[env(safe-area-inset-bottom)]">
        <SheetHeader class="sr-only">
          <SheetTitle>Más opciones</SheetTitle>
          <SheetDescription>Opciones de navegación adicionales</SheetDescription>
        </SheetHeader>

        <!-- User profile row -->
        <div class="flex items-center gap-3 px-5 pt-1 pb-3">
          <Avatar class="size-9">
            <AvatarImage v-if="user?.image" :src="user.image" :alt="user.name" />
            <AvatarFallback class="bg-primary/10 text-primary text-xs font-semibold">
              {{ initials }}
            </AvatarFallback>
          </Avatar>
          <div class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-sm font-semibold">{{ user?.name }}</span>
            <span class="text-xs text-muted-foreground">{{ roleLabel }}</span>
          </div>
        </div>

        <Separator />

        <!-- Grouped navigation -->
        <div class="max-h-[50vh] overflow-y-auto px-3 py-2">
          <div v-for="group in secondaryGroups" :key="group.label" class="py-1.5">
            <span class="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {{ group.label }}
            </span>
            <div class="mt-1 flex flex-col gap-0.5">
              <NuxtLink
                v-for="item in group.items"
                :key="item.to"
                :to="item.to"
                class="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-accent"
                active-class="!text-primary !bg-accent"
                @click="moreOpen = false"
              >
                <component :is="item.icon" class="size-4 text-muted-foreground" />
                <span class="text-sm">{{ item.label }}</span>
                <Badge
                  v-if="item.to === '/vigilancia/alertas' && hasActiveAlert"
                  variant="destructive"
                  class="ml-auto h-5 min-w-5 animate-pulse px-1.5 text-[10px] font-bold"
                >
                  !
                </Badge>
              </NuxtLink>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Logout -->
        <div class="px-3 py-2">
          <button
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-destructive transition-colors hover:bg-destructive/10"
            @click="signOut"
          >
            <LogOut class="size-4" />
            <span class="text-sm font-medium">Cerrar sesión</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  </nav>
</template>
