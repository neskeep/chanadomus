<template>
  <div class="relative grid min-h-dvh grid-rows-[1fr_auto] bg-background">
    <!-- Decorative teal glow -->
    <div class="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[600px] -translate-x-1/2 rounded-lg bg-accent/50 blur-3xl" />

    <!-- Content — centered in available space (viewport - footer) -->
    <div class="relative flex items-center justify-center px-6">
      <div class="w-full max-w-md">
        <slot />
      </div>
    </div>

    <!-- Footer -->
    <p class="pb-6 text-center text-xs text-muted-foreground/60">
      Powered by <a href="https://zunamicorp.com/" target="_blank" rel="noopener noreferrer" class="hover:text-muted-foreground">Zunami Corp</a>
    </p>
  </div>
</template>
