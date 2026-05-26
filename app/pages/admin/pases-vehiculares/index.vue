<script setup lang="ts">
import { Car, Plus, QrCode, ShieldOff } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { VehiclePassType } from '~~/shared/types/vehicle-pass'

useHead({ title: 'Pases Vehiculares' })

const { target, isMounted } = useTopbarPortal()
const { passes, isLoading, error, fetchPasses, deactivatePass } = useVehiclePasses()
const { formatDate } = useFormatDate()
const { downloadBadge, isGenerating } = useQrBadge()

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
      || p.unitNumber?.toLowerCase().includes(q)
      || p.description?.toLowerCase().includes(q),
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
  { value: 'temporary', label: 'Temporal' },
]

const passTypeLabel: Record<string, string> = {
  resident: 'Residente',
  guest: 'Invitado',
  temporary: 'Temporal',
}

const passTypeBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  resident: 'default',
  guest: 'secondary',
  temporary: 'outline',
}

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

function handleDownloadQr(pass: (typeof passes.value)[number]) {
  const label = pass.vehiclePlate ?? pass.description ?? '—'
  downloadBadge({
    name: label,
    roleName: passTypeLabel[pass.passType] ?? pass.passType,
    unitNumber: pass.unitNumber,
    unitLabel: pass.unitLabel,
    qrToken: pass.token,
  })
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

    <!-- Mobile search -->
    <div class="mb-4 md:hidden">
      <TopbarSearch v-model="searchQuery" placeholder="Filtrar pases...">
        <TopbarFilters :active="hasActiveFilters" @clear="filterType = ''; filterActive = 'active'">
          <TopbarFilterGroup v-model="filterType" label="Tipo" :options="typeOptions" />
          <TopbarFilterGroup v-model="filterActive" label="Estado" :options="statusOptions" />
        </TopbarFilters>
      </TopbarSearch>
    </div>

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
      <NuxtLink v-for="pass in filteredPasses" :key="pass.id" :to="`/admin/pases-vehiculares/${pass.id}`" class="block">
        <Card class="min-w-0 transition-colors hover:bg-accent/50">
        <CardContent class="px-3 py-2.5">
          <!-- Row 1: Plate/Description + Badges -->
          <div class="flex items-center gap-1.5">
            <p v-if="pass.vehiclePlate" class="min-w-0 flex-1 truncate font-mono text-sm font-bold tracking-wider">
              {{ pass.vehiclePlate }}
            </p>
            <p v-else class="min-w-0 flex-1 truncate text-sm font-semibold">
              {{ pass.description ?? '—' }}
            </p>
            <Badge :variant="passTypeBadgeVariant[pass.passType] ?? 'default'" class="shrink-0 text-[11px]">
              {{ passTypeLabel[pass.passType] ?? pass.passType }}
            </Badge>
            <Badge :variant="pass.isActive ? 'default' : 'destructive'" class="shrink-0 text-[11px]">
              {{ pass.isActive ? 'Activo' : 'Inactivo' }}
            </Badge>
          </div>

          <!-- Row 2: Vehicle info / Description + Unit + Expiry + Actions -->
          <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
            <span v-if="pass.vehicleBrand || pass.vehicleModel" class="truncate">
              {{ [pass.vehicleBrand, pass.vehicleModel, pass.vehicleColor].filter(Boolean).join(' ') }}
            </span>
            <span v-else-if="pass.vehiclePlate && pass.description" class="truncate">
              {{ pass.description }}
            </span>
            <template v-if="pass.unitNumber">
              <span v-if="pass.vehicleBrand || pass.vehicleModel || (pass.vehiclePlate && pass.description)" class="opacity-30">·</span>
              <span class="shrink-0">{{ pass.unitLabel || pass.unitNumber }}</span>
            </template>
            <span class="opacity-30">·</span>
            <span v-if="pass.expiresAt" class="shrink-0">Vence: {{ formatDate(pass.expiresAt) }}</span>
            <span v-else class="shrink-0">Permanente</span>

            <!-- Actions for active passes -->
            <template v-if="pass.isActive">
              <Button
                size="sm"
                variant="ghost"
                class="ml-auto h-6 shrink-0 gap-1 px-2 text-[11px] text-muted-foreground hover:text-primary"
                :disabled="isGenerating"
                @click.prevent="handleDownloadQr(pass)"
              >
                <QrCode class="size-3" />
                QR
              </Button>
              <Button
                size="sm"
                variant="ghost"
                class="h-6 shrink-0 gap-1 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                :disabled="deactivatingId === pass.id"
                @click.prevent="handleDeactivate(pass.id)"
              >
                <ShieldOff class="size-3" />
                {{ deactivatingId === pass.id ? '...' : 'Desactivar' }}
              </Button>
            </template>
          </div>
        </CardContent>
        </Card>
      </NuxtLink>
    </div>
  </div>
</template>
