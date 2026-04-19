<script setup lang="ts">
import {
  ChevronLeft,
  Users,
  Car,
  Phone,
  Home,
} from 'lucide-vue-next'
import type { HouseholdRelationship } from '~~/shared/types/household'

definePageMeta({ layout: 'default' })

const route = useRoute()
const unitId = route.params.id as string

const { members, isLoading: membersLoading, fetchMembers } = useUnitMembers(unitId)
const { vehicles, isLoading: vehiclesLoading, fetchVehicles } = useUnitVehicles(unitId)

const unit = ref<{ id: string; number: string; label: string | null } | null>(null)
const unitLoading = ref(true)

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
  <div class="mx-auto max-w-3xl">
    <!-- Back button -->
    <Button
      variant="ghost"
      size="sm"
      class="mb-4"
      @click="navigateTo('/vigilancia/residentes')"
    >
      <ChevronLeft class="mr-1 size-4" />
      Volver al directorio
    </Button>

    <!-- Unit header -->
    <div v-if="unitLoading" class="mb-6">
      <Skeleton class="mb-2 h-8 w-32" />
      <Skeleton class="h-4 w-48" />
    </div>
    <div v-else-if="unit" class="mb-6">
      <div class="flex items-center gap-3">
        <div class="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Home class="size-6 text-primary" />
        </div>
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Unidad {{ unit.number }}</h1>
          <p v-if="unit.label" class="text-sm text-muted-foreground">{{ unit.label }}</p>
        </div>
      </div>
    </div>
    <div v-else class="mb-6">
      <h1 class="text-xl font-semibold tracking-tight">Unidad no encontrada</h1>
      <p class="mt-1 text-sm text-muted-foreground">La unidad solicitada no existe</p>
    </div>

    <!-- Members section -->
    <section class="mb-8">
      <div class="mb-3 flex items-center gap-2">
        <Users class="size-5 text-muted-foreground" />
        <h2 class="text-base font-semibold">Miembros del Hogar</h2>
      </div>

      <div v-if="membersLoading" class="space-y-2">
        <Skeleton v-for="i in 3" :key="i" class="h-20 w-full rounded-lg" />
      </div>

      <div
        v-else-if="members.length === 0"
        class="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center"
      >
        <Users class="size-8 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">No hay miembros registrados en esta unidad</p>
      </div>

      <div v-else class="space-y-2">
        <Card v-for="member in members" :key="member.id">
          <CardContent class="p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium">{{ member.name }}</p>
                <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge :variant="RELATIONSHIP_VARIANT[member.relationship]" class="text-xs">
                    {{ RELATIONSHIP_LABELS[member.relationship] }}
                  </Badge>
                </div>
              </div>
            </div>
            <p v-if="member.phone" class="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone class="size-3" />
              {{ member.phone }}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- Vehicles section -->
    <section>
      <div class="mb-3 flex items-center gap-2">
        <Car class="size-5 text-muted-foreground" />
        <h2 class="text-base font-semibold">Vehículos Registrados</h2>
      </div>

      <div v-if="vehiclesLoading" class="space-y-2">
        <Skeleton v-for="i in 2" :key="i" class="h-20 w-full rounded-lg" />
      </div>

      <div
        v-else-if="vehicles.length === 0"
        class="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center"
      >
        <Car class="size-8 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">No hay vehículos registrados en esta unidad</p>
      </div>

      <div v-else class="space-y-2">
        <Card v-for="vehicle in vehicles" :key="vehicle.id">
          <CardContent class="flex items-center gap-3 p-4">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <Car class="size-5 text-muted-foreground" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold uppercase tracking-wider">{{ vehicle.plate }}</p>
              <p class="text-xs text-muted-foreground">
                {{ vehicle.brand }} {{ vehicle.model }}
              </p>
            </div>
            <Badge variant="outline" class="shrink-0">
              {{ vehicle.color }}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </section>
  </div>
</template>
