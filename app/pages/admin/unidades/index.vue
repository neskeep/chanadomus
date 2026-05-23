<script setup lang="ts">
import { Users, Car, Home, HardHat } from 'lucide-vue-next'

useHead({ title: 'Ranchos' })

interface UnitDirectory {
  id: string
  number: string
  label: string | null
  isActive: boolean
  memberCount: number
  vehicleCount: number
  staffCount: number
}

function hasActivity(unit: UnitDirectory) {
  return unit.memberCount > 1 || unit.vehicleCount > 0 || unit.staffCount > 0
}

const { target, isMounted } = useTopbarPortal()

const searchQuery = ref('')
const isLoading = ref(true)
const error = ref<string | null>(null)
const units = ref<UnitDirectory[]>([])

async function fetchUnits() {
  isLoading.value = true
  error.value = null
  try {
    const res = await $fetch<{ data: UnitDirectory[] }>('/api/units/directory')
    units.value = res.data
  }
  catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error al cargar unidades'
  }
  finally {
    isLoading.value = false
  }
}

function filterByQuery(list: UnitDirectory[]) {
  if (!searchQuery.value.trim()) return list
  const q = searchQuery.value.trim().toLowerCase()
  return list.filter(u =>
    u.number.toLowerCase().includes(q)
    || u.label?.toLowerCase().includes(q),
  )
}

const ranchos = computed(() => filterByQuery(units.value.filter(u => u.number.startsWith('R-'))))
const parcelas = computed(() => filterByQuery(units.value.filter(u => u.number.startsWith('P-'))))
const hasResults = computed(() => ranchos.value.length > 0 || parcelas.value.length > 0)

onMounted(() => {
  fetchUnits()
})
</script>

<template>
  <div>
    <Teleport :to="target" defer v-if="isMounted">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar unidad..." />
    </Teleport>

    <!-- Mobile search -->
    <div class="mb-4 md:hidden">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar unidad..." />
    </div>

    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      <Skeleton v-for="i in 8" :key="i" class="h-28 w-full rounded-lg" />
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="!hasResults"
      :icon="Home"
      title="No se encontraron unidades"
      :description="searchQuery ? 'Prueba con otro término de búsqueda' : 'No hay unidades registradas'"
    />

    <template v-else>
      <!-- Ranchos -->
      <div v-if="ranchos.length > 0" class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <Card
          v-for="unit in ranchos"
          :key="unit.id"
          :class="[
            'transition-colors',
            unit.isActive
              ? 'cursor-pointer hover:bg-muted/50'
              : 'opacity-50 grayscale',
          ]"
          @click="navigateTo(`/admin/unidades/${unit.id}`)"
        >
          <CardContent class="px-3 py-2.5">
            <div class="flex items-center gap-1.5">
              <p class="min-w-0 truncate text-sm font-semibold">{{ unit.label || unit.number }}</p>
              <Badge v-if="!unit.isActive" variant="outline" class="shrink-0 text-[10px]">Inactiva</Badge>
            </div>
            <div v-if="hasActivity(unit)" class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
              <span class="inline-flex items-center gap-1">
                <Users class="size-3" />
                {{ unit.memberCount }}
              </span>
              <span v-if="unit.vehicleCount > 0" class="inline-flex items-center gap-1">
                <Car class="size-3" />
                {{ unit.vehicleCount }}
              </span>
              <span v-if="unit.staffCount > 0" class="inline-flex items-center gap-1">
                <HardHat class="size-3" />
                {{ unit.staffCount }}
              </span>
            </div>
            <p v-else class="mt-1.5 text-[11px] text-muted-foreground/50">Sin actividad</p>
          </CardContent>
        </Card>
      </div>

      <!-- Parcelas -->
      <div v-if="parcelas.length > 0" class="mt-8">
        <p class="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Parcelas</p>
        <div class="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
          <Card
            v-for="unit in parcelas"
            :key="unit.id"
            :class="[
              'transition-colors',
              unit.isActive
                ? 'cursor-pointer hover:bg-muted/50'
                : 'opacity-50 grayscale',
            ]"
            @click="navigateTo(`/admin/unidades/${unit.id}`)"
          >
            <CardContent class="px-2.5 py-2">
              <div class="flex items-center gap-1">
                <p class="min-w-0 truncate text-xs">{{ unit.label || unit.number }}</p>
                <Badge v-if="!unit.isActive" variant="outline" class="shrink-0 text-[9px]">Inactiva</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
