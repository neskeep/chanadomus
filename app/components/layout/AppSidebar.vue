<script setup lang="ts">
import { PanelLeft } from 'lucide-vue-next'
import { useSidebar } from '~/components/ui/sidebar'
import { ROLE_REDIRECTS } from '~~/shared/types/auth'

const { role } = useAuth()
const route = useRoute()
const { groups } = useNavigation()
const { hasActiveAlert } = usePanicStream()

const roleHome = computed(() => role.value ? ROLE_REDIRECTS[role.value] : '/')

const isActive = (to: string) => {
  if (to === roleHome.value) return route.path === to
  return route.path.startsWith(to)
}

// Close sidebar on mobile when navigating
const { openMobile, setOpenMobile, toggleSidebar } = useSidebar()
watch(() => route.path, () => {
  if (openMobile.value) setOpenMobile(false)
})
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader class="h-[68px] justify-center border-b border-sidebar-border">
      <!-- Expanded: logo + collapse trigger -->
      <div class="group-data-[state=collapsed]:hidden flex items-center justify-between px-1">
        <AppLogo :height="36" />
        <SidebarTrigger class="shrink-0 text-sidebar-foreground/70" />
      </div>
      <!-- Collapsed: isotipo centered, no link -->
      <div class="group-data-[state=expanded]:hidden flex justify-center">
        <AppIsotipo class="size-7" />
      </div>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup v-for="group in groups" :key="group.label">
        <SidebarGroupLabel>{{ group.label }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in group.items" :key="item.to">
              <SidebarMenuButton as-child :tooltip="item.label" :is-active="isActive(item.to)">
                <NuxtLink :to="item.to">
                  <component :is="item.icon" />
                  <span>{{ item.label }}</span>
                  <Badge
                    v-if="item.to === '/vigilancia/alertas' && hasActiveAlert"
                    variant="destructive"
                    class="ml-auto h-5 min-w-5 animate-pulse px-1.5 text-[10px] font-bold"
                  >
                    !
                  </Badge>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu class="hidden group-data-[state=collapsed]:block">
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Expandir menú" @click="toggleSidebar">
            <PanelLeft class="size-4" />
            <span>Expandir</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <LayoutUserMenu />
    </SidebarFooter>
  </Sidebar>
</template>
