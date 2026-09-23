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
      <header class="shrink-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur md:hidden">
        <AppIsotipo :height="24" class="shrink-0" />
        <span class="min-w-0 flex-1 truncate text-sm font-semibold text-muted-foreground">{{ usePageInfo().title }}</span>
        <div class="flex shrink-0 items-center gap-1">
          <div id="topbar-actions-mobile" class="flex items-center gap-1" />
          <Button variant="ghost" size="icon" class="size-11" as-child>
            <NuxtLink to="/mi-chana/notificaciones" aria-label="Notificaciones">
              <Bell class="size-5" />
            </NuxtLink>
          </Button>
          <PanicButton />
        </div>
      </header>

      <!-- Global announcement bar -->
      <AnnouncementBar />

      <!-- Scrollable content -->
      <div ref="contentRef" class="relative flex-1 overflow-y-auto">
        <div class="px-4 py-6 lg:px-6">
          <!-- Aviso descartable para activar push en este dispositivo -->
          <PushPrompt class="mb-6" />
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
