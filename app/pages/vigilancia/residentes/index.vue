<script setup lang="ts">
import {
  Search,
  Car,
  Home,
  Users,
  X,
} from 'lucide-vue-next'

definePageMeta({ layout: 'default', title: 'Directorio de Residentes' })

// Vehicle search
const { results: vehicleResults, isLoading: vehicleSearchLoading, query: vehicleQuery, searchByPlate, clearSearch } = useVehicleSearch()
const plateInput = ref('')

// Units list
const units = ref<{ id: string; number: string; label: string | null }[]>([])
const unitsLoading = ref(false)
const unitsError = ref<string | null>(null)
const unitSearch = ref('')

const filteredUnits = computed(() => {
  if (!unitSearch.value.trim()) return units.value
  const q = unitSearch.value.trim().toLowerCase()
  return units.value.filter(u =>
    u.number.toLowerCase().includes(q)
    || u.label?.toLowerCase().includes(q),
  )
})

async function fetchUnits() {
  unitsLoading.value = true
  unitsError.value = null
  try {
    const res = await $fetch<{ data: { id: string; number: string; label: string | null }[] }>('/api/units')
    units.value = res.data
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al cargar unidades'
    unitsError.value = message
  }
  finally {
    unitsLoading.value = false
  }
}

function handlePlateSearch() {
  const plate = plateInput.value.trim()
  if (plate.length >= 2) {
    searchByPlate(plate)
  }
}

function handleClearSearch() {
  plateInput.value = ''
  clearSearch()
}

onMounted(() => {
  fetchUnits()
})
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <!-- Plate search -->
    <Card class="mb-6">
      <CardContent class="p-4">
        <p class="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <Car class="size-4" />
          Buscar por placa
        </p>
        <form class="flex gap-2" @submit.prevent="handlePlateSearch">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="plateInput"
              placeholder="Ingresa número de placa..."
              class="pl-9"
            />
          </div>
          <Button type="submit" size="sm" :disabled="plateInput.trim().length < 2 || vehicleSearchLoading">
            Buscar
          </Button>
        </form>

        <!-- Vehicle search results -->
        <div v-if="vehicleSearchLoading" class="mt-3 space-y-2">
          <Skeleton class="h-16 w-full rounded-lg" />
        </div>

        <div v-else-if="vehicleQuery && vehicleResults.length > 0" class="mt-3 space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-xs font-medium text-muted-foreground">
              {{ vehicleResults.length }} resultado{{ vehicleResults.length > 1 ? 's' : '' }}
            </p>
            <Button variant="ghost" size="sm" class="h-7 text-xs" @click="handleClearSearch">
              <X class="mr-1 size-3" />
              Limpiar
            </Button>
          </div>
          <Card
            v-for="vehicle in vehicleResults"
            :key="vehicle.id"
            class="cursor-pointer transition-shadow hover:shadow-md"
            @click="navigateTo(`/vigilancia/residentes/${vehicle.unitId}`)"
          >
            <CardContent class="flex items-center gap-3 p-3">
              <div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Car class="size-4 text-primary" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold uppercase tracking-wider">{{ vehicle.plate }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ vehicle.brand }} {{ vehicle.model }} · {{ vehicle.color }}
                </p>
              </div>
              <Badge variant="secondary" class="shrink-0">
                Unidad {{ vehicle.unitNumber }}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div
          v-else-if="vehicleQuery && vehicleResults.length === 0"
          class="mt-3 rounded-md bg-muted/50 p-3 text-center text-sm text-muted-foreground"
        >
          No se encontraron vehículos con la placa "{{ vehicleQuery }}"
        </div>
      </CardContent>
    </Card>

    <!-- Error -->
    <div
      v-if="unitsError"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ unitsError }}
    </div>

    <!-- Units search -->
    <div class="mb-4">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="unitSearch"
          placeholder="Buscar unidad por número o nombre..."
          class="pl-9"
        />
      </div>
    </div>

    <!-- Units loading -->
    <div v-if="unitsLoading" class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      <Skeleton v-for="i in 8" :key="i" class="h-24 w-full rounded-lg" />
    </div>

    <!-- Empty units -->
    <div
      v-else-if="filteredUnits.length === 0"
      class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
    >
      <div class="flex size-10 items-center justify-center rounded-lg bg-muted">
        <Home class="size-5 text-muted-foreground" />
      </div>
      <div>
        <p class="font-medium">No se encontraron unidades</p>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ unitSearch ? 'Prueba con otro término de búsqueda' : 'No hay unidades registradas' }}
        </p>
      </div>
    </div>

    <!-- Units grid -->
    <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      <Card
        v-for="unit in filteredUnits"
        :key="unit.id"
        class="cursor-pointer transition-shadow hover:shadow-md"
        @click="navigateTo(`/vigilancia/residentes/${unit.id}`)"
      >
        <CardContent class="flex flex-col items-center justify-center p-3 text-center">
          <div class="flex size-8 items-center justify-center rounded-md bg-primary/10">
            <Home class="size-4 text-primary" />
          </div>
          <p class="mt-1.5 text-base font-bold">{{ unit.number }}</p>
          <p v-if="unit.label" class="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {{ unit.label }}
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
