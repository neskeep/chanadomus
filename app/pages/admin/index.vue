<script setup lang="ts">
import {
  AlertTriangle,
  Building2,
  Calendar,
  Megaphone,
  MessageCircle,
  Users,
  Vote,
  Wallet,
  Wrench,
} from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const { user } = useAuth()

const modules = [
  { label: 'Finanzas', description: 'Cuotas, pagos y reportes', icon: Wallet, to: '/admin/finanzas' },
  { label: 'Incidencias', description: 'Reportes y seguimiento', icon: AlertTriangle, to: '/admin/incidencias' },
  { label: 'Unidades', description: 'Fichas y residentes', icon: Building2, to: '/admin/unidades' },
  { label: 'Personal', description: 'Equipo de trabajo', icon: Users, to: '/admin/personal' },
  { label: 'Cartelera', description: 'Anuncios y comunicados', icon: Megaphone, to: '/admin/cartelera' },
  { label: 'Votaciones', description: 'Encuestas comunitarias', icon: Vote, to: '/admin/votaciones' },
  { label: 'Proveedores', description: 'Directorio de servicios', icon: Wrench, to: '/admin/proveedores' },
  { label: 'Reuniones', description: 'Calendario y convocatorias', icon: Calendar, to: '/admin/reuniones' },
  { label: 'Chat', description: 'Mensajeria en tiempo real', icon: MessageCircle, to: '/mi-chana/chat' },
]
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold tracking-tight">Panel Administrador</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Hola, {{ user?.name }} — Gestiona tu comunidad
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
