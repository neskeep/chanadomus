<script setup lang="ts">
import { Bell, LogOut, ChevronsUpDown } from 'lucide-vue-next'
import { ROLE_LABELS } from '~~/shared/types/auth'

interface Props {
  variant?: 'sidebar' | 'topbar'
}

withDefaults(defineProps<Props>(), {
  variant: 'sidebar',
})

const { user, role, signOut } = useAuth()

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
</script>

<template>
  <!-- Sidebar variant -->
  <SidebarMenu v-if="variant === 'sidebar'">
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton size="lg" class="cursor-pointer">
            <Avatar class="size-8">
              <AvatarFallback class="bg-primary/10 text-primary text-sm font-semibold">
                {{ initials }}
              </AvatarFallback>
            </Avatar>
            <div class="flex flex-col gap-0.5 leading-none">
              <span class="font-semibold text-sm">{{ user?.name }}</span>
              <span class="text-xs text-muted-foreground">{{ roleLabel }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" class="w-56">
          <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem as-child>
            <NuxtLink to="/mi-chana/notificaciones">
              <Bell class="size-4" />
              Notificaciones
            </NuxtLink>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="signOut">
            <LogOut class="size-4" />
            Cerrar sesion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>

  <!-- Topbar variant -->
  <DropdownMenu v-else>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="relative size-10 rounded-full">
        <Avatar class="size-9">
          <AvatarFallback class="bg-primary/10 text-primary text-sm font-semibold">
            {{ initials }}
          </AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel>
        <div class="flex flex-col">
          <span>{{ user?.name }}</span>
          <span class="text-xs font-normal text-muted-foreground">{{ roleLabel }}</span>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem as-child>
        <NuxtLink to="/mi-chana/notificaciones">
          <Bell class="size-4" />
          Notificaciones
        </NuxtLink>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="signOut">
        <LogOut class="size-4" />
        Cerrar sesion
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
