<script setup lang="ts">
/**
 * Renders a create/action button in the mobile topbar header.
 * Use alongside the desktop Teleport to #topbar-actions.
 * Shows as icon-only button to save space in the mobile header.
 */
const { mobileTarget, isMounted } = useTopbarPortal()
</script>

<template>
  <Teleport :to="mobileTarget" v-if="isMounted">
    <slot />
  </Teleport>
</template>
