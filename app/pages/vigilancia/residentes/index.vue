<script setup lang="ts">
import {
  Car,
  Home,
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

// Tab filter
const activeTab = ref('all')

const occupiedCount = computed(() => units.value.filter(u => u.memberCount > 0).length)
const emptyCount = computed(() => units.value.filter(u => u.memberCount === 0).length)

const filteredUnits = computed(() => {
  let filtered = units.value

  // Tab filter
  if (activeTab.value === 'occupied') {
    filtered = filtered.filter(u => u.memberCount > 0)
  }
  else if (activeTab.value === 'empty') {
    filtered = filtered.filter(u => u.memberCount === 0)
  }

  // Search filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    filtered = filtered.filter(u =>
      u.number.toLowerCase().includes(q)
      || u.label?.toLowerCase().includes(q),
    )
  }

  return filtered
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
  <div class="space-y-4">
    <Teleport v-if="isMounted" :to="target" defer>
      <TopbarSearch v-model="searchQuery" placeholder="Buscar unidad o placa..." />
    </Teleport>

    <!-- Vehicle search results -->
    <section v-if="vehicleSearchLoading" aria-label="Cargando vehículos">
      <ListSkeleton :count="2" variant="card" />
    </section>

    <section v-else-if="vehicleQuery && vehicleResults.length > 0" aria-label="Resultados de vehículos">
      <div class="mb-3 flex items-center justify-between">
        <p class="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Car class="size-4" />
          {{ vehicleResults.length }} vehículo{{ vehicleResults.length > 1 ? 's' : '' }} encontrado{{ vehicleResults.length > 1 ? 's' : '' }}
        </p>
        <Button variant="ghost" size="sm" class="h-8 text-sm" @click="handleClearSearch">
          Limpiar
        </Button>
      </div>
      <div class="space-y-2">
        <Card
          v-for="vehicle in vehicleResults"
          :key="vehicle.id"
          class="cursor-pointer transition-all hover:shadow-md motion-safe:active:scale-[0.98]"
          @click="navigateTo(`/vigilancia/residentes/${vehicle.unitId}`)"
        >
          <CardContent class="flex items-center gap-3 px-3 py-2.5">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold uppercase tracking-wider">{{ vehicle.plate }}</p>
              <p class="text-[11px] text-muted-foreground">
                {{ vehicle.brand }} {{ vehicle.model }} <span class="opacity-30">&middot;</span> {{ vehicle.color }}
              </p>
            </div>
            <Badge variant="secondary" class="shrink-0 text-[11px]">
              Unidad {{ vehicle.unitNumber }}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Separator class="mt-4" />
    </section>

    <section
      v-else-if="vehicleQuery && vehicleResults.length === 0"
      aria-label="Sin resultados de vehículos"
    >
      <div class="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        No se encontraron vehículos con la placa "{{ vehicleQuery }}"
      </div>

      <Separator class="mt-4" />
    </section>

    <!-- Error -->
    <ErrorAlert :message="unitsError" />

    <!-- Units loading -->
    <section v-if="unitsLoading" aria-label="Cargando unidades">
      <ListSkeleton :count="6" variant="card" />
    </section>

    <!-- Units content -->
    <template v-else-if="!unitsError">
      <!-- Filter tabs -->
      <Tabs v-model="activeTab" default-value="all">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({{ units.length }})
          </TabsTrigger>
          <TabsTrigger value="occupied">
            Ocupados ({{ occupiedCount }})
          </TabsTrigger>
          <TabsTrigger value="empty">
            Vacíos ({{ emptyCount }})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <!-- Empty filtered -->
      <EmptyState
        v-if="filteredUnits.length === 0"
        :icon="Home"
        title="No se encontraron unidades"
        :description="searchQuery ? 'Prueba con otro termino de busqueda' : 'No hay unidades en esta categoria'"
      />

      <!-- Units grid -->
      <section v-else aria-label="Directorio de unidades">
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <Card
            v-for="unit in filteredUnits"
            :key="unit.id"
            class="cursor-pointer transition-all hover:shadow-md motion-safe:active:scale-[0.98]"
            :class="unit.memberCount === 0 ? 'border-dashed opacity-60' : ''"
            @click="navigateTo(`/vigilancia/residentes/${unit.id}`)"
          >
            <CardContent class="px-3 py-2.5">
              <p class="text-base font-bold leading-tight tabular-nums">{{ unit.number }}</p>
              <p v-if="unit.label" class="truncate text-[11px] text-muted-foreground">
                {{ unit.label }}
              </p>
              <p v-if="unit.memberCount > 0" class="mt-0.5 text-[11px] text-muted-foreground">
                {{ unit.memberCount }} residente{{ unit.memberCount !== 1 ? 's' : '' }}
                <template v-if="unit.vehicleCount > 0">
                  <span class="opacity-30">&middot;</span>
                  {{ unit.vehicleCount }} vehículo{{ unit.vehicleCount !== 1 ? 's' : '' }}
                </template>
              </p>
              <p v-else class="mt-0.5 text-[11px] text-muted-foreground/50">
                Sin residentes
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </template>

  </div>
</template>
