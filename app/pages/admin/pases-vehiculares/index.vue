<script setup lang="ts">
import { Car, Plus, ShieldOff } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { VehiclePassType } from '~~/shared/types/vehicle-pass'

useHead({ title: 'Pases Vehiculares' })

const { target, isMounted } = useTopbarPortal()
const { passes, isLoading, error, fetchPasses, deactivatePass } = useVehiclePasses()
const { formatDate } = useFormatDate()

// Filters
const searchQuery = ref('')
const filterType = ref<VehiclePassType | ''>('')
const filterActive = ref<'active' | 'inactive' | ''>('active')

const filteredPasses = computed(() => {
  let list = [...passes.value]
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(p =>
      p.vehiclePlate?.toLowerCase().includes(q)
      || p.vehicleBrand?.toLowerCase().includes(q)
      || p.vehicleModel?.toLowerCase().includes(q)
      || p.unitNumber?.toLowerCase().includes(q),
    )
  }
  if (filterType.value) {
    list = list.filter(p => p.passType === filterType.value)
  }
  if (filterActive.value === 'active') {
    list = list.filter(p => p.isActive)
  }
  else if (filterActive.value === 'inactive') {
    list = list.filter(p => !p.isActive)
  }
  return list
})

const typeOptions = [
  { value: 'resident', label: 'Residente' },
  { value: 'guest', label: 'Invitado' },
]

const statusOptions = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
]

const deactivatingId = ref<string | null>(null)

async function handleDeactivate(id: string) {
  deactivatingId.value = id
  try {
    const ok = await deactivatePass(id)
    if (ok) {
      toast.success('Pase desactivado')
    }
    else {
      toast.error('Error al desactivar pase')
    }
  }
  finally {
    deactivatingId.value = null
  }
}

const hasActiveFilters = computed(() => filterType.value !== '' || filterActive.value !== 'active')

onMounted(() => {
  fetchPasses()
})
</script>

<template>
  <div>
    <!-- Topbar -->
    <Teleport v-if="isMounted" :to="target" defer>
      <TopbarSearch v-model="searchQuery" placeholder="Filtrar pases...">
        <TopbarFilters :active="hasActiveFilters" @clear="filterType = ''; filterActive = 'active'">
          <TopbarFilterGroup v-model="filterType" label="Tipo" :options="typeOptions" />
          <TopbarFilterGroup v-model="filterActive" label="Estado" :options="statusOptions" />
        </TopbarFilters>
      </TopbarSearch>
      <Button size="sm" as-child>
        <NuxtLink to="/admin/pases-vehiculares/nuevo">
          <Plus class="mr-1.5 size-3.5" />
          Crear Pase
        </NuxtLink>
      </Button>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" as-child>
        <NuxtLink to="/admin/pases-vehiculares/nuevo">
          <Plus class="size-4" />
        </NuxtLink>
      </Button>
    </TopbarMobileAction>

    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading && passes.length === 0" :count="4" variant="row" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="filteredPasses.length === 0"
      :icon="Car"
      title="Sin pases vehiculares"
      :description="hasActiveFilters ? 'Prueba cambiando los filtros' : 'Crea pases QR para vehiculos registrados'"
    />

    <!-- Pass list -->
    <div v-else class="space-y-2">
      <Card v-for="pass in filteredPasses" :key="pass.id" class="min-w-0">
        <CardContent class="px-3 py-2.5">
          <!-- Row 1: Plate + Badges -->
          <div class="flex items-center gap-1.5">
            <p class="min-w-0 flex-1 truncate font-mono text-sm font-bold tracking-wider">
              {{ pass.vehiclePlate ?? '—' }}
            </p>
            <Badge :variant="pass.passType === 'resident' ? 'default' : 'secondary'" class="shrink-0 text-[11px]">
              {{ pass.passType === 'resident' ? 'Residente' : 'Invitado' }}
            </Badge>
            <Badge :variant="pass.isActive ? 'default' : 'destructive'" class="shrink-0 text-[11px]">
              {{ pass.isActive ? 'Activo' : 'Inactivo' }}
            </Badge>
          </div>

          <!-- Row 2: Vehicle info + Unit + Expiry + Actions -->
          <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
            <span v-if="pass.vehicleBrand || pass.vehicleModel" class="truncate">
              {{ [pass.vehicleBrand, pass.vehicleModel, pass.vehicleColor].filter(Boolean).join(' ') }}
            </span>
            <template v-if="pass.unitNumber">
              <span class="opacity-30">·</span>
              <span class="shrink-0">{{ pass.unitNumber }}</span>
            </template>
            <span class="opacity-30">·</span>
            <span v-if="pass.expiresAt" class="shrink-0">Vence: {{ formatDate(pass.expiresAt) }}</span>
            <span v-else class="shrink-0">Permanente</span>

            <!-- Inline deactivate action -->
            <Button
              v-if="pass.isActive"
              size="sm"
              variant="ghost"
              class="ml-auto h-6 shrink-0 gap-1 px-2 text-[11px] text-muted-foreground hover:text-destructive"
              :disabled="deactivatingId === pass.id"
              @click="handleDeactivate(pass.id)"
            >
              <ShieldOff class="size-3" />
              {{ deactivatingId === pass.id ? '...' : 'Desactivar' }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
