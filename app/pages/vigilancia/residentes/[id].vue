<script setup lang="ts">
import {
  Users,
  Car,
  Phone,
  CircleOff,
} from 'lucide-vue-next'
import type { HouseholdRelationship } from '~~/shared/types/household'

definePageMeta({ layout: 'default' })

const route = useRoute()
const unitId = route.params.id as string

const { members, isLoading: membersLoading, error: membersError, fetchMembers } = useUnitMembers(unitId)
const { vehicles, isLoading: vehiclesLoading, error: vehiclesError, fetchVehicles } = useUnitVehicles(unitId)

const unit = ref<{ id: string; number: string; label: string | null } | null>(null)
const unitLoading = ref(true)

// Override topbar title with dynamic unit info
const pageOverride = computed(() => {
  if (unitLoading.value) return null
  if (!unit.value) return { title: 'Unidad no encontrada', description: 'La unidad solicitada no existe' }
  return {
    title: `Unidad ${unit.value.number}`,
    description: unit.value.label ?? 'Datos y vehículos',
    breadcrumbs: [{ label: 'Directorio', to: '/vigilancia/residentes' }],
  }
})
usePageInfoOverride(pageOverride)

const RELATIONSHIP_LABELS: Record<HouseholdRelationship, string> = {
  owner: 'Propietario',
  spouse: 'Cónyuge',
  child: 'Hijo/a',
  tenant: 'Inquilino',
  other: 'Otro',
}

const RELATIONSHIP_VARIANT: Record<HouseholdRelationship, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  spouse: 'secondary',
  child: 'outline',
  tenant: 'secondary',
  other: 'outline',
}

/** Map common Spanish color names to CSS-safe hex values */
const COLOR_MAP: Record<string, string> = {
  blanco: '#FFFFFF',
  negro: '#1a1a1a',
  gris: '#6B7280',
  plata: '#C0C0C0',
  rojo: '#DC2626',
  azul: '#2563EB',
  verde: '#16A34A',
  amarillo: '#EAB308',
  naranja: '#EA580C',
  marrón: '#92400E',
  marron: '#92400E',
  beige: '#D2B48C',
  dorado: '#D97706',
  vino: '#7F1D1D',
  celeste: '#38BDF8',
  morado: '#7C3AED',
  rosado: '#EC4899',
  rosa: '#EC4899',
  white: '#FFFFFF',
  black: '#1a1a1a',
  gray: '#6B7280',
  grey: '#6B7280',
  silver: '#C0C0C0',
  red: '#DC2626',
  blue: '#2563EB',
  green: '#16A34A',
  yellow: '#EAB308',
  orange: '#EA580C',
  brown: '#92400E',
  gold: '#D97706',
}

/** Sort members so owner(s) appear first */
const sortedMembers = computed(() => {
  return [...members.value].sort((a, b) => {
    if (a.relationship === 'owner' && b.relationship !== 'owner') return -1
    if (a.relationship !== 'owner' && b.relationship === 'owner') return 1
    return 0
  })
})

/** Extract initials from a full name (first letter of first name + first letter of last name) */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1] ?? '') : ''
  if (!last) return first.charAt(0).toUpperCase()
  return (first.charAt(0) + last.charAt(0)).toUpperCase()
}

/** Resolve vehicle color name to a hex value, or null if unknown */
function resolveColor(colorName: string): string | null {
  return COLOR_MAP[colorName.toLowerCase().trim()] ?? null
}

onMounted(async () => {
  try {
    const res = await $fetch<{ data: { id: string; number: string; label: string | null }[] }>('/api/units')
    unit.value = res.data.find(u => u.id === unitId) ?? null
  }
  catch {
    // silently fail, unit info is non-critical
  }
  finally {
    unitLoading.value = false
  }

  await Promise.all([fetchMembers(), fetchVehicles()])
})
</script>

<template>
  <div>
    <!-- Members section -->
    <section class="mb-8">
      <div class="mb-4 flex items-center gap-2">
        <Users class="size-5 text-muted-foreground" />
        <h2 class="text-lg font-semibold">Miembros del Hogar</h2>
        <Badge v-if="!membersLoading && members.length > 0" variant="secondary" class="ml-auto text-xs">
          {{ members.length }}
        </Badge>
      </div>

      <ErrorAlert :message="membersError" />

      <ListSkeleton v-if="membersLoading" :count="3" variant="card" />

      <EmptyState
        v-else-if="members.length === 0 && !membersError"
        :icon="Users"
        title="Sin miembros registrados"
        description="No hay miembros registrados en esta unidad"
      />

      <div v-else class="space-y-2">
        <Card
          v-for="member in sortedMembers"
          :key="member.id"
        >
          <CardContent class="px-3 py-2.5">
            <div class="flex items-center gap-3">
              <!-- Avatar with initials -->
              <Avatar class="size-10 shrink-0">
                <AvatarFallback
                  :class="[
                    'text-sm font-semibold',
                    member.relationship === 'owner'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  ]"
                >
                  {{ getInitials(member.name) }}
                </AvatarFallback>
              </Avatar>

              <!-- Name + badge -->
              <div class="min-w-0 flex-1">
                <p class="text-base font-semibold leading-tight">{{ member.name }}</p>
                <Badge
                  :variant="RELATIONSHIP_VARIANT[member.relationship]"
                  class="mt-1.5 text-xs"
                >
                  {{ RELATIONSHIP_LABELS[member.relationship] }}
                </Badge>
              </div>
            </div>

            <!-- Phone: tap-to-call -->
            <div v-if="member.phone" class="mt-3 flex items-center">
              <a
                :href="`tel:${member.phone}`"
                class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary active:bg-primary/20"
                :aria-label="`Llamar a ${member.name} al ${member.phone}`"
              >
                <Phone class="size-4" />
                {{ member.phone }}
              </a>
            </div>

            <!-- No phone indicator -->
            <p v-else class="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CircleOff class="size-3.5" />
              Sin teléfono registrado
            </p>
          </CardContent>
        </Card>
      </div>
    </section>

    <Separator class="mb-8" />

    <!-- Vehicles section -->
    <section class="pb-8">
      <div class="mb-4 flex items-center gap-2">
        <Car class="size-5 text-muted-foreground" />
        <h2 class="text-lg font-semibold">Vehículos Registrados</h2>
        <Badge v-if="!vehiclesLoading && vehicles.length > 0" variant="secondary" class="ml-auto text-xs">
          {{ vehicles.length }}
        </Badge>
      </div>

      <ErrorAlert :message="vehiclesError" />

      <ListSkeleton v-if="vehiclesLoading" :count="2" variant="card" />

      <EmptyState
        v-else-if="vehicles.length === 0 && !vehiclesError"
        :icon="Car"
        title="Sin vehículos registrados"
        description="No hay vehículos registrados en esta unidad"
      />

      <div v-else class="space-y-2">
        <Card v-for="vehicle in vehicles" :key="vehicle.id">
          <CardContent class="flex items-center gap-4 px-3 py-2.5">
            <!-- Car icon with color dot -->
            <div class="relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Car class="size-5 text-muted-foreground" />
              <span
                v-if="resolveColor(vehicle.color)"
                class="absolute -right-1 -top-1 size-4 rounded-lg border-2 border-background"
                :style="{ backgroundColor: resolveColor(vehicle.color)! }"
                :aria-label="`Color: ${vehicle.color}`"
              />
            </div>

            <!-- Plate + details -->
            <div class="min-w-0 flex-1">
              <p class="font-mono text-lg font-bold uppercase tracking-widest leading-tight">
                {{ vehicle.plate }}
              </p>
              <p class="mt-0.5 text-sm text-muted-foreground">
                {{ vehicle.brand }} {{ vehicle.model }}
              </p>
            </div>

            <!-- Color badge -->
            <Badge variant="outline" class="shrink-0 capitalize">
              {{ vehicle.color }}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </section>
  </div>
</template>
