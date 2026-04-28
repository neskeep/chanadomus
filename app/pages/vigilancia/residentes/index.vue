<script setup lang="ts">
import {
  Car,
  Home,
  Users,
} from 'lucide-vue-next'

useHead({ title: 'Directorio de Residentes' })

const { target, isMounted } = useTopbarPortal()

// Unified search
const searchQuery = ref('')

// Vehicle search
const { results: vehicleResults, isLoading: vehicleSearchLoading, query: vehicleQuery, searchByPlate, clearSearch } = useVehicleSearch()

// Units list with enriched data from /api/units/directory
interface DirectoryUnit {
  id: string
  number: string
  label: string | null
  memberCount: number
  vehicleCount: number
}

const units = ref<DirectoryUnit[]>([])
const unitsLoading = ref(false)
const unitsError = ref<string | null>(null)

const filteredUnits = computed(() => {
  if (!searchQuery.value.trim()) return units.value
  const q = searchQuery.value.trim().toLowerCase()
  return units.value.filter(u =>
    u.number.toLowerCase().includes(q)
    || u.label?.toLowerCase().includes(q),
  )
})

// Trigger plate search when query >= 2 chars
watch(searchQuery, (val) => {
  const trimmed = val.trim()
  if (trimmed.length >= 2) {
    searchByPlate(trimmed)
  }
  else if (trimmed.length === 0 && vehicleQuery.value) {
    clearSearch()
  }
})

async function fetchUnits() {
  unitsLoading.value = true
  unitsError.value = null
  try {
    const res = await $fetch<{ data: DirectoryUnit[] }>('/api/units/directory')
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

function handleClearSearch() {
  searchQuery.value = ''
  clearSearch()
}

onMounted(() => {
  fetchUnits()
})
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-4">
    <Teleport v-if="isMounted" :to="target" defer>
      <TopbarSearch v-model="searchQuery" placeholder="Buscar unidad o placa..." />
    </Teleport>

    <!-- Vehicle search results -->
    <section v-if="vehicleSearchLoading" aria-label="Cargando vehiculos">
      <ListSkeleton :count="2" variant="card" />
    </section>

    <section v-else-if="vehicleQuery && vehicleResults.length > 0" aria-label="Resultados de vehiculos">
      <div class="mb-3 flex items-center justify-between">
        <p class="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Car class="size-4" />
          {{ vehicleResults.length }} vehiculo{{ vehicleResults.length > 1 ? 's' : '' }} encontrado{{ vehicleResults.length > 1 ? 's' : '' }}
        </p>
        <Button variant="ghost" size="sm" class="h-8 text-sm" @click="handleClearSearch">
          Limpiar
        </Button>
      </div>
      <div class="space-y-2">
        <Card
          v-for="vehicle in vehicleResults"
          :key="vehicle.id"
          class="cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]"
          @click="navigateTo(`/vigilancia/residentes/${vehicle.unitId}`)"
        >
          <CardContent class="flex items-center gap-3 p-4">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Car class="size-5 text-primary" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-base font-bold uppercase tracking-wider">{{ vehicle.plate }}</p>
              <p class="text-sm text-muted-foreground">
                {{ vehicle.brand }} {{ vehicle.model }} · {{ vehicle.color }}
              </p>
            </div>
            <Badge variant="secondary" class="shrink-0 text-sm">
              Unidad {{ vehicle.unitNumber }}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Separator class="mt-4" />
    </section>

    <section
      v-else-if="vehicleQuery && vehicleResults.length === 0"
      aria-label="Sin resultados de vehiculos"
    >
      <div class="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        No se encontraron vehiculos con la placa "{{ vehicleQuery }}"
      </div>

      <Separator class="mt-4" />
    </section>

    <!-- Error -->
    <ErrorAlert :message="unitsError" />

    <!-- Units loading -->
    <section v-if="unitsLoading" aria-label="Cargando unidades">
      <ListSkeleton :count="6" variant="card" />
    </section>

    <!-- Empty units -->
    <EmptyState
      v-else-if="filteredUnits.length === 0 && !unitsError"
      :icon="Home"
      title="No se encontraron unidades"
      :description="searchQuery ? 'Prueba con otro termino de busqueda' : 'No hay unidades registradas'"
    />

    <!-- Units grid -->
    <section v-else aria-label="Directorio de unidades">
      <p class="mb-3 text-sm font-medium text-muted-foreground">
        {{ filteredUnits.length }} unidad{{ filteredUnits.length !== 1 ? 'es' : '' }}
      </p>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Card
          v-for="unit in filteredUnits"
          :key="unit.id"
          class="min-h-[60px] cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]"
          :class="unit.memberCount === 0 ? 'border-dashed border-muted-foreground/30' : ''"
          @click="navigateTo(`/vigilancia/residentes/${unit.id}`)"
        >
          <CardContent class="flex items-center gap-3 p-4">
            <div
              class="flex size-11 shrink-0 items-center justify-center rounded-lg"
              :class="unit.memberCount === 0 ? 'bg-muted' : 'bg-primary/10'"
            >
              <Home
                class="size-5"
                :class="unit.memberCount === 0 ? 'text-muted-foreground' : 'text-primary'"
              />
            </div>

            <div class="min-w-0 flex-1">
              <p class="text-lg font-bold leading-tight">{{ unit.number }}</p>
              <p v-if="unit.label" class="text-sm text-muted-foreground line-clamp-1">
                {{ unit.label }}
              </p>
            </div>

            <div class="flex shrink-0 flex-col items-end gap-1">
              <Badge
                :variant="unit.memberCount > 0 ? 'secondary' : 'outline'"
                class="gap-1 text-xs"
              >
                <Users class="size-3" />
                {{ unit.memberCount }}
              </Badge>
              <Badge
                v-if="unit.vehicleCount > 0"
                variant="outline"
                class="gap-1 text-xs"
              >
                <Car class="size-3" />
                {{ unit.vehicleCount }}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  </div>
</template>
