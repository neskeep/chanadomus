<script setup lang="ts">
import { Building2, PanelLeft } from 'lucide-vue-next'
import { useSidebar } from '~/components/ui/sidebar'
import { ROLE_REDIRECTS } from '~~/shared/types/auth'

const { role } = useAuth()
const route = useRoute()
const { groups } = useNavigation()

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
    <SidebarHeader>
      <div class="flex items-center">
        <SidebarMenu class="flex-1">
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as-child>
              <NuxtLink :to="roleHome">
                <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 class="size-4" />
                </div>
                <div class="flex flex-col gap-0.5 leading-none">
                  <span class="font-semibold">ChanaDomus</span>
                </div>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <button
          class="group-data-[state=collapsed]:hidden flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          @click="toggleSidebar"
        >
          <PanelLeft class="size-4" />
        </button>
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
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu class="group-data-[state=expanded]:hidden">
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Expandir menú" @click="toggleSidebar">
            <PanelLeft class="size-4" />
            <span>Expandir menú</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <LayoutUserMenu variant="sidebar" />
    </SidebarFooter>
  </Sidebar>
</template>
