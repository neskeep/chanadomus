<script setup lang="ts">
const { user } = useAuth()
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold tracking-tight">Panel Administrador</h1>
    <p class="mt-1 text-sm text-muted-foreground">Bienvenido, {{ user?.name }}</p>

    <Card class="mt-6" size="sm">
      <CardContent class="pt-6">
        <p class="text-sm text-muted-foreground">
          Módulos disponibles próximamente: Control de Acceso QR, Finanzas, Incidencias, Comunicación.
        </p>
      </CardContent>
    </Card>
  </div>
</template>
