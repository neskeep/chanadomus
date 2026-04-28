<script setup lang="ts">
import { Bell } from 'lucide-vue-next'

const contentRef = ref<HTMLElement>()
useContentResize(contentRef)
</script>

<template>
  <SidebarProvider>
    <LayoutAppSidebar />

    <SidebarInset>
      <!-- Desktop/tablet topbar -->
      <LayoutAppTopbar />

      <!-- Mobile header -->
      <header class="shrink-0 z-40 flex h-12 items-center justify-between border-b bg-background/95 px-3 backdrop-blur md:hidden">
        <SidebarTrigger class="size-9" />
        <span class="text-sm font-semibold text-muted-foreground truncate">{{ usePageInfo().title }}</span>
        <div class="flex items-center gap-1">
          <PanicButton />
          <NuxtLink to="/mi-chana/notificaciones">
            <Button variant="ghost" size="icon" class="size-9">
              <Bell class="size-4" />
            </Button>
          </NuxtLink>
        </div>
      </header>

      <!-- Scrollable content -->
      <div ref="contentRef" class="relative flex-1 overflow-y-auto">
        <div class="px-4 py-6 lg:px-6">
          <slot />
        </div>
        <!-- Bottom nav spacer on mobile -->
        <div class="h-[4.5rem] md:hidden" />
      </div>

      <!-- Mobile bottom nav -->
      <LayoutAppBottomNav />
    </SidebarInset>
  </SidebarProvider>
</template>
