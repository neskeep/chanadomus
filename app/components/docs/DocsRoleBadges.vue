<script setup lang="ts">
type RoleKey = 'admin' | 'propietario' | 'conserje' | 'vigilancia'

interface Props {
  roles: RoleKey[]
}

defineProps<Props>()

const roleLabels: Record<RoleKey, string> = {
  admin: 'Administrador',
  propietario: 'Propietario',
  conserje: 'Conserje',
  vigilancia: 'Vigilancia',
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <span class="text-xs text-muted-foreground">Disponible para:</span>
    <Badge
      v-for="role in roles"
      :key="role"
      variant="secondary"
      class="text-[11px]"
    >
      {{ roleLabels[role] }}
    </Badge>
  </div>
</template>
