<script setup lang="ts">
/**
 * Renders a create/action button in the mobile topbar header.
 * Use alongside the desktop Teleport to #topbar-actions.
 * Shows as icon-only button to save space in the mobile header.
 */
const { mobileTarget, isMounted } = useTopbarPortal()
</script>

<template>
  <Teleport v-if="isMounted" :to="mobileTarget">
    <slot />
  </Teleport>
</template>
