<script setup lang="ts">
import { Search, Users, Car, Home } from 'lucide-vue-next'

useHead({ title: 'Unidades' })

interface UnitDirectory {
  id: string
  number: string
  label: string | null
  memberCount: number
  vehicleCount: number
}

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
  <div class="mx-auto max-w-5xl">
    <!-- Error -->
    <div
      v-if="error"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Search -->
    <div class="mb-4">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Buscar por numero o nombre..."
          class="h-12 pl-9"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      <Skeleton v-for="i in 8" :key="i" class="h-28 w-full rounded-lg" />
    </div>

    <!-- Empty state -->
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
          {{ searchQuery ? 'Prueba con otro termino de busqueda' : 'No hay unidades registradas' }}
        </p>
      </div>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      <Card
        v-for="unit in filteredUnits"
        :key="unit.id"
        class="cursor-pointer transition-shadow hover:shadow-md"
        @click="navigateTo(`/admin/unidades/${unit.id}`)"
      >
        <CardContent class="p-4">
          <p class="text-lg font-semibold">{{ unit.number }}</p>
          <p v-if="unit.label" class="mt-0.5 text-sm text-muted-foreground">{{ unit.label }}</p>
          <div class="mt-2 flex items-center gap-2.5">
            <span class="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Users class="size-4" />
              {{ unit.memberCount }}
            </span>
            <span class="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Car class="size-4" />
              {{ unit.vehicleCount }}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
