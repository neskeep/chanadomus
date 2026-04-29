<script setup lang="ts">
import { Users, Car, Home } from 'lucide-vue-next'

useHead({ title: 'Unidades' })

interface UnitDirectory {
  id: string
  number: string
  label: string | null
  memberCount: number
  vehicleCount: number
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

const filteredUnits = computed(() => {
  if (!searchQuery.value.trim()) return units.value
  const q = searchQuery.value.trim().toLowerCase()
  return units.value.filter(u =>
    u.number.toLowerCase().includes(q)
    || u.label?.toLowerCase().includes(q),
  )
})

onMounted(() => {
  fetchUnits()
})
</script>

<template>
  <div>
    <Teleport :to="target" defer v-if="isMounted">
      <TopbarSearch v-model="searchQuery" placeholder="Buscar unidad..." />
    </Teleport>

    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      <Skeleton v-for="i in 8" :key="i" class="h-28 w-full rounded-lg" />
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="filteredUnits.length === 0"
      :icon="Home"
      title="No se encontraron unidades"
      :description="searchQuery ? 'Prueba con otro término de búsqueda' : 'No hay unidades registradas'"
    />

    <!-- Grid -->
    <div v-else class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      <Card
        v-for="unit in filteredUnits"
        :key="unit.id"
        class="cursor-pointer transition-colors hover:bg-muted/50"
        @click="navigateTo(`/admin/unidades/${unit.id}`)"
      >
        <CardContent class="px-3 py-2.5">
          <div class="flex items-baseline gap-2">
            <p class="text-base font-bold tabular-nums">{{ unit.number }}</p>
            <p v-if="unit.label" class="min-w-0 truncate text-sm text-muted-foreground">{{ unit.label }}</p>
          </div>
          <div class="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span class="inline-flex items-center gap-1">
              <Users class="size-3" />
              {{ unit.memberCount }} residentes
            </span>
            <span class="inline-flex items-center gap-1">
              <Car class="size-3" />
              {{ unit.vehicleCount }}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
