<script setup lang="ts">
import {
  AlertTriangle,
  Calendar,
  Megaphone,
  MessageCircle,
  UserCheck,
  Vote,
  Wallet,
  Wrench,
} from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const { user } = useAuth()

const modules = [
  { label: 'Estado de Cuenta', description: 'Cuotas y pagos', icon: Wallet, to: '/propietario/informes' },
  { label: 'Incidencias', description: 'Reportar y dar seguimiento', icon: AlertTriangle, to: '/propietario/incidencias' },
  { label: 'Mis Visitas', description: 'QR de acceso para visitantes', icon: UserCheck, to: '/propietario/mis-visitas' },
  { label: 'Cartelera', description: 'Anuncios de la comunidad', icon: Megaphone, to: '/mi-chana/cartelera' },
  { label: 'Votaciones', description: 'Participa en las decisiones', icon: Vote, to: '/mi-chana/votaciones' },
  { label: 'Proveedores', description: 'Directorio de servicios', icon: Wrench, to: '/mi-chana/proveedores' },
  { label: 'Reuniones', description: 'Proximas reuniones', icon: Calendar, to: '/mi-chana/reuniones' },
  { label: 'Chat', description: 'Mensajeria en tiempo real', icon: MessageCircle, to: '/mi-chana/chat' },
]
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold tracking-tight">Mi Vivienda</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Hola, {{ user?.name }} — Tu espacio en la comunidad
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
