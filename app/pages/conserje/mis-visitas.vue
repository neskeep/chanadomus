<script setup lang="ts">
import { Plus, User } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { QrStatus } from '~~/shared/types/qr'

useHead({ title: 'Visitas del Rancho' })

const { target, isMounted } = useTopbarPortal()
const { myCodes, fetchMyCodes, cancelQr, isCanceling, isLoading, error } = useQr()

// --- QR codes state ---
// Al entrar solo se muestran pases vigentes; el resto queda tras el filtro.
// El TopbarFilterGroup usa '' al deseleccionar; lo tratamos como "activos".
const activeFilter = ref<QrStatus | ''>('active')
const resolvedFilter = computed<QrStatus>(() => activeFilter.value || 'active')

const filterOptions: Array<{ value: QrStatus; label: string }> = [
  { value: 'active', label: 'Activos' },
  { value: 'used', label: 'Usados' },
  { value: 'expired', label: 'Expirados' },
  { value: 'canceled', label: 'Cancelados' },
]

onMounted(() => {
  fetchMyCodes(resolvedFilter.value)
})

watch(resolvedFilter, (status) => {
  fetchMyCodes(status)
})

async function handleCancel(id: string) {
  try {
    await cancelQr(id)
    toast.success('Pase cancelado')
  }
  catch {
    toast.error(error.value ?? 'No se pudo cancelar el pase')
  }
}

const EMPTY_STATE: Record<QrStatus, { title: string; description: string }> = {
  active: { title: 'Sin pases activos', description: 'Crea un pase de acceso para un visitante del rancho' },
  used: { title: 'Sin pases usados', description: 'Aquí verás los pases que ya fueron escaneados' },
  expired: { title: 'Sin pases expirados', description: 'Aquí verás los pases que vencieron sin usarse' },
  canceled: { title: 'Sin pases cancelados', description: 'Aquí verás los pases que hayan sido cancelados' },
}
const emptyState = computed(() => EMPTY_STATE[resolvedFilter.value])
</script>

<template>
  <div>
    <!-- Topbar actions (desktop) -->
    <Teleport v-if="isMounted" :to="target" defer>
      <TopbarFilters :active="resolvedFilter !== 'active'" @clear="activeFilter = 'active'">
        <TopbarFilterGroup v-model="activeFilter" label="Estado" :options="filterOptions" />
      </TopbarFilters>
      <Button size="sm" @click="navigateTo('/conserje/nueva-visita')">
        <Plus class="mr-1.5 size-3.5" />
        Nueva
      </Button>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" @click="navigateTo('/conserje/nueva-visita')">
        <Plus class="size-4" />
      </Button>
    </TopbarMobileAction>

    <!-- Error alert -->
    <ErrorAlert :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="3" />

    <!-- Empty state -->
    <EmptyState
      v-else-if="myCodes.length === 0"
      :icon="User"
      :title="emptyState.title"
      :description="emptyState.description"
    >
      <template v-if="resolvedFilter === 'active'" #action>
        <Button @click="navigateTo('/conserje/nueva-visita')">
          <Plus class="mr-1.5 size-4" />
          Nueva Visita
        </Button>
      </template>
    </EmptyState>

    <!-- Visits list -->
    <div v-else class="space-y-2">
      <VisitPassCard
        v-for="code in myCodes"
        :key="code.id"
        :pass="code"
        :is-canceling="isCanceling"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>
