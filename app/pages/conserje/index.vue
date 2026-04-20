<script setup lang="ts">
import {
  Calendar,
  Megaphone,
  MessageCircle,
  UserPlus,
  Wrench,
} from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const { user } = useAuth()

const modules = [
  { label: 'Nueva Entrada', description: 'Registrar visitante manual', icon: UserPlus, to: '/conserje/nueva-entrada' },
  { label: 'Cartelera', description: 'Anuncios de la comunidad', icon: Megaphone, to: '/mi-chana/cartelera' },
  { label: 'Proveedores', description: 'Directorio de servicios', icon: Wrench, to: '/mi-chana/proveedores' },
  { label: 'Reuniones', description: 'Proximas reuniones', icon: Calendar, to: '/mi-chana/reuniones' },
  { label: 'Chat', description: 'Mensajeria en tiempo real', icon: MessageCircle, to: '/mi-chana/chat' },
]
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold tracking-tight">Panel Conserjeria</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Hola, {{ user?.name }} — Gestion de visitantes y servicios
    </p>

    <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <NuxtLink v-for="mod in modules" :key="mod.to" :to="mod.to" class="block">
        <Card class="transition-colors hover:bg-muted/50">
          <CardContent class="flex items-center gap-3 p-4">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <component :is="mod.icon" class="size-5 text-primary" />
            </div>
            <div>
              <p class="text-sm font-medium">{{ mod.label }}</p>
              <p class="text-xs text-muted-foreground">{{ mod.description }}</p>
            </div>
          </CardContent>
        </Card>
      </NuxtLink>
    </div>
  </div>
</template>
