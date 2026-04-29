<script setup lang="ts">
import { Bell, LogOut, ChevronsUpDown } from 'lucide-vue-next'
import { ROLE_LABELS } from '~~/shared/types/auth'

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
  <SidebarMenu>
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
              <span class="text-sm font-semibold truncate">{{ user?.name }}</span>
              <span class="text-xs text-muted-foreground">{{ roleLabel }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4 text-muted-foreground" />
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
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
